import { EventEmitter2 } from 'eventemitter2';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import KeyExchange from './KeyExchange';

export default class Socket extends EventEmitter2 {
  socket = null;

  clientsConnected = false;

  clientsReady = false;

  isOriginator;

  channelId = null;

  keyExchange: KeyExchange;

  manualDisconnect = false;
  reconnect: boolean;

  constructor({ otherPublicKey, reconnect }) {
    super();

    this.reconnect = reconnect;

    this.socket = io('https://lizard-positive-office.glitch.me');

    this.socket.on('error', () => {
      //console.log('Error, Connecting to channel again', error);
      this.socket.disconnect();
      setTimeout(() => {
        this.socket = io('https://lizard-positive-office.glitch.me');
        this.socket.emit('join_channel', this.channelId);
      }, 2000);
    });

    this.socket.on('disconnect', () => {
      if (this.manualDisconnect) return;
      //console.log('Disconnect, Connecting to channel again', error);
      this.socket.disconnect();
      setTimeout(() => {
        this.socket = io('https://lizard-positive-office.glitch.me');
        this.connectToChannel(this.channelId);
      }, 2000);
    });

    this.keyExchange = new KeyExchange({
      commLayer: this,
      otherPublicKey,
      sendPublicKey: false,
    });

    this.keyExchange.on('keys_exchanged', () => {
      this.emit('clients_ready', {
        isOriginator: this.isOriginator,
      });
    });
  }

  receiveMessages(channelId) {
    this.socket.on(`clients_connected-${channelId}`, (id) => {
      this.channelId = id;
      this.clientsConnected = true;
      if (this.isOriginator) {
        if (this.keyExchange.keysExchanged) {
          return;
        }
        this.keyExchange.start(this.isOriginator);
      }
      if (this.reconnect) {
        if (this.keyExchange.keysExchanged) {
          this.sendMessage({ type: 'ready' });
        } else {
          this.sendMessage({ type: 'key_handshake_start' });
        }
        this.reconnect = false;
      }
    });

    this.socket.on(`channel_created-${channelId}`, (id) => {
      this.emit('channel_created', id);
    });

    this.socket.on(`clients_disconnected-${channelId}`, () => {
      if (!this.isOriginator) return;
      this.clientsConnected = false;
      this.emit('clients_disconnected');
    });

    this.socket.on(`message-${channelId}`, ({ id, message, error }) => {
      if (error) {
        throw new Error(error);
      }

      this.checkSameId(id);

      if (
        this.isOriginator &&
        this.keyExchange.keysExchanged &&
        message?.type === 'key_handshake_start'
      ) {
        return this.keyExchange.start(this.isOriginator);
      }

      if (!this.keyExchange.keysExchanged) {
        const messageReceived = message;
        if (messageReceived?.type.startsWith('key_handshake')) {
          return this.emit('key_exchange', { message: messageReceived });
        }
        throw new Error('Keys not exchanged');
      }

      const decryptedMessage = this.keyExchange.decryptMessage(message);
      const messageReceived = JSON.parse(decryptedMessage);
      return this.emit('message', { message: messageReceived });
    });

    this.socket.on(
      `clients_waiting_to_join-${channelId}`,
      (numberUsers: number) => {
        this.emit('clients_waiting_to_join', numberUsers);
      },
    );
  }

  checkSameId(id) {
    if (id !== this.channelId) {
      throw new Error('Wrong id');
    }
  }

  send(type, message) {
    this.socket.emit(type, message);
  }

  sendMessage(message) {
    if (!this.channelId) {
      throw new Error('Create a channel first');
    }
    if (!this.keyExchange.keysExchanged) {
      if (message?.type.startsWith('key_handshake')) {
        return this.socket.emit('message', { id: this.channelId, message });
      }
      throw new Error('Keys not exchanged');
    }

    const encryptedMessage = this.keyExchange.encryptMessage(
      JSON.stringify(message),
    );

    return this.socket.emit('message', {
      id: this.channelId,
      message: encryptedMessage,
    });
  }

  connectToChannel(id) {
    this.channelId = id;
    this.receiveMessages(this.channelId);
    this.socket.emit('join_channel', id);
  }

  createChannel() {
    this.isOriginator = true;
    const channelId = uuidv4();
    this.receiveMessages(channelId);
    this.socket.emit('join_channel', channelId);
    return { channelId, pubKey: this.keyExchange.myPublicKey };
  }

  pause() {
    this.manualDisconnect = true;
    if (this.keyExchange.keysExchanged) {
      this.sendMessage({ type: 'pause' });
    }
    this.socket.disconnect();
  }

  resume() {
    this.manualDisconnect = false;
    if (this.keyExchange.keysExchanged) {
      this.reconnect = true;
      this.socket.connect();
      this.socket.emit('join_channel', this.channelId);
    }
  }
}
