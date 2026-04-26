import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

type BrandLogoProps = {
  width?: number;
  height?: number;
  iconSize?: number;
  gap?: number;
  variant?: 'row' | 'stacked';
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  logoStyle?: StyleProp<ImageStyle>;
};

export const BrandLogo = ({
  width = 140,
  height = 28,
  iconSize,
  gap = 8,
  variant = 'row',
  containerStyle,
  style,
  logoStyle,
}: BrandLogoProps) => {
  const resolvedIconSize = iconSize ?? Math.round(height * 1.45);
  const isStacked = variant === 'stacked';

  return (
    <View
      style={[
        {
          flexDirection: isStacked ? 'column' : 'row',
          alignItems: 'center',
          minHeight: isStacked ? resolvedIconSize + height + gap : resolvedIconSize,
        },
        containerStyle,
        style,
      ]}
    >
      <Image
        source={require('../../assets/stylehair-icon.png')}
        style={{
          width: resolvedIconSize,
          height: resolvedIconSize,
          marginRight: isStacked ? 0 : gap,
          marginBottom: isStacked ? gap : 0,
        }}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/stylehair-logo.png')}
        style={[{ width, height, marginTop: -1 }, logoStyle]}
        resizeMode="contain"
      />
    </View>
  );
};
