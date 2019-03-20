import React from 'react';
import PropTypes from 'prop-types';
import { Image } from 'react-native';
import { toDataUrl } from '../../../util/blockies.js';
import FadeIn from 'react-native-fade-in-image';
import { colors } from '../../../styles/common.js';

/**
 * UI component that renders an Identicon
 * for now it's just a blockie
 * but we could add more types in the future
 */
// eslint-disable-next-line react/display-name
const Identicon = React.memo(props => {
	const { diameter, address, customStyle } = props;
	if (!address) return null;

	const uri = toDataUrl(address);

	return (
		<FadeIn placeholderStyle={{ backgroundColor: colors.white }}>
			<Image
				source={{ uri }}
				style={[
					{
						height: diameter,
						width: diameter,
						borderRadius: diameter / 2
					},
					customStyle
				]}
			/>
		</FadeIn>
	);
});

Identicon.propTypes = {
	/**
	 * Diameter that represents the size of the identicon
	 */
	diameter: PropTypes.number,
	/**
	 * Address used to render a specific identicon
	 */
	address: PropTypes.string,
	/**
	 * Custom style to apply to image
	 */
	customStyle: PropTypes.object
};

Identicon.defaultProps = {
	diameter: 46
};

export default Identicon;
