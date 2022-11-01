// Third party dependencies.
import { ViewProps } from 'react-native';

// External dependencies
import { AvatarSizes } from '../../Avatar.types';

/**
 * AvatarBase component props.
 */
export interface AvatarBaseProps extends ViewProps {
  /**
   * Optional enum to select between Avatar sizes.
   * @default Md
   */
  size?: AvatarSizes;
}

/**
 * Style sheet input parameters.
 */
export type AvatarBaseStyleSheetVars = Pick<AvatarBaseProps, 'style' | 'size'>;