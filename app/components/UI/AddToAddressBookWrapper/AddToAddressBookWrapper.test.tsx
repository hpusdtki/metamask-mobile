import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeContext, mockTheme } from '../../../util/theme';
import AddToAddressBookWrapper, {
  ADD_TO_ADDRESS_BOOK_BUTTON_ID,
} from './AddToAddressBookWrapper';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (fn: any) =>
    fn({
      engine: {
        backgroundState: {
          PreferencesController: {
            selectedAddress: '0x0',
            identities: {
              '0x0': {
                address: '0x0',
                name: 'Account 1',
              },
            },
          },
          NetworkController: {
            network: 1,
            provider: {
              ticker: 'eth',
            },
          },
          AddressBookController: {
            addressBook: {
              1: {
                '0x1': {
                  address: '0x1',
                  name: 'Account 2',
                },
              },
            },
          },
        },
      },
    }),
}));

describe('AddToAddressBookWrapper', () => {
  it('should match default snapshot', async () => {
    const container = render(
      <AddToAddressBookWrapper address="0x10e08af911f2e48948">
        <Text>DUMMY</Text>
      </AddToAddressBookWrapper>,
    );
    expect(container).toMatchSnapshot();
  });
  it('should open addressbook for new address', async () => {
    const { queryByText, getByTestId, getByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <AddToAddressBookWrapper address="0x10e08af911f2e48948">
          <Text>DUMMY</Text>
        </AddToAddressBookWrapper>
      </ThemeContext.Provider>,
    );
    expect(queryByText(ADD_TO_ADDRESS_BOOK_BUTTON_ID)).toBeDefined();
    fireEvent.press(getByTestId(ADD_TO_ADDRESS_BOOK_BUTTON_ID));
    expect(getByText('Add to address book')).toBeDefined();
  });
  it('should not render touchable wrapper if address is already saved', async () => {
    const { queryByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <AddToAddressBookWrapper address="0x0">
          <Text>DUMMY</Text>
        </AddToAddressBookWrapper>
      </ThemeContext.Provider>,
    );
    expect(queryByText('DUMMY')).toBeDefined();
    expect(queryByText(ADD_TO_ADDRESS_BOOK_BUTTON_ID)).toBeNull();
  });
  it('should return null if address is already saved and defaultNull is true', async () => {
    const { queryByText } = render(
      <ThemeContext.Provider value={mockTheme}>
        <AddToAddressBookWrapper address="0x0" defaultNull>
          <Text>DUMMY</Text>
        </AddToAddressBookWrapper>
      </ThemeContext.Provider>,
    );
    expect(queryByText('DUMMY')).toBeNull();
    expect(queryByText(ADD_TO_ADDRESS_BOOK_BUTTON_ID)).toBeNull();
  });
});
