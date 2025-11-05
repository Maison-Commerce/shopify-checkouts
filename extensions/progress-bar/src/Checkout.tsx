import {
  BlockStack,
  Text,
  reactExtension,
  useSettings,
  InlineLayout,
  useCurrency,
  useLanguage,
  Image,
  Spacing,
  CornerRadius,
  InlineAlignment,
  Appearance,
  useSubtotalAmount,
  useCartLines,
  useShippingAddress,
  Banner,
  View,
  TextBlock,
  Grid,
  useAttributeValues,
} from '@shopify/ui-extensions-react/checkout';
import {
  MaybeResponsiveConditionalStyle,
} from '@shopify/ui-extensions/src/surfaces/checkout/style';
import {
  MaybeShorthandProperty,
} from '@shopify/ui-extensions/src/surfaces/checkout/components/shared';
import {
  TextSize,
} from '@shopify/ui-extensions/build/ts/surfaces/checkout/components/shared';
import useMetaObjectTranslations from './metaobject_translations';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension/>,
);

type TextAppearance = Extract<
  Appearance,
  | 'accent'
  | 'subdued'
  | 'info'
  | 'success'
  | 'warning'
  | 'critical'
  | 'decorative'
>;

function Extension() {
  const settings = useSettings();
  console.log('All settings:', settings);
  
  const language = useLanguage();
  const currency = useCurrency();
  const { translate } = useMetaObjectTranslations();
  const cartLines = useCartLines();
  const shippingAddress = useShippingAddress();
  const { step1, step2, step3, completed_steps, color_hex, bar_text, bar_text_size, bar_icon, bar_icon_size, first_bar_size, display_first_bar_text } = useSettings();
  const [maisonProgressBarVisibility] = useAttributeValues(["_maisonProgressBar"]);
  
  // Check if the extension should be hidden
  const hideExtension = maisonProgressBarVisibility === "false";
  
  // If _progressBarCheckoutVisibility is "false", don't render anything
  if (hideExtension) {
    return null;
  }

  if (!step1 || !step2 || !step3) {
    // ... existing code ...
  }

  const {
    country_thresholds,
    free_shipping_reached_text,
    free_shipping_not_reached_text,
    image_src,
    alignment,
    spacing,
    bar_height,
    corner_radius,
    text_size,
    text_appearance,
    text_appearance_reached,
  } = useSettings();

  // Parse country thresholds
  const getThresholdForCountry = (countryCode: string): number | null => {
    console.log('Raw country_thresholds:', country_thresholds);
    if (!country_thresholds) return null;
    
    const thresholds = country_thresholds.split('\n').reduce((acc, line) => {
      const [country, amount] = line.trim().split('=');
      console.log('Parsing line:', { line, country, amount });
      if (country && amount && !isNaN(parseFloat(amount))) {
        acc[country.toUpperCase()] = parseFloat(amount);
      }
      return acc;
    }, {} as Record<string, number>);

    console.log('Parsed thresholds:', thresholds);
    console.log('Looking for country:', countryCode);
    return thresholds[countryCode?.toUpperCase()] || null;
  };

  const subTotalAmount = useSubtotalAmount();
  const subTotalAmountInCents = Math.round(subTotalAmount.amount * 100);
  
  // Get threshold based on shipping country
  const countrySpecificThreshold = shippingAddress?.countryCode 
    ? getThresholdForCountry(shippingAddress.countryCode)
    : null;

  const freeShippingAmountInCents = Math.round(
    (countrySpecificThreshold || 0) * 100
  );

  const amountLeftInCents = Math.max(0, freeShippingAmountInCents - subTotalAmountInCents);
  const hasReachedFreeShipping = countrySpecificThreshold 
    ? amountLeftInCents <= 0 
    : false;

  const currencyFormat = new Intl.NumberFormat(language?.isoCode ?? 'en-US', {
    currency: currency?.isoCode || 'USD',
    style: 'currency',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const replaceStringValues = (string) => {
    // First, replace the flag placeholder if country code exists
    let formattedString = string.replace(
      '{flag}',
      shippingAddress?.countryCode ? getCountryFlag(shippingAddress.countryCode) : ''
    );

    // Then replace the currency values
    formattedString = formattedString.replace(
      '{total_amount}',
      currencyFormat.format(subTotalAmountInCents / 100),
    ).replace(
      '{free_shipping_amount}',
      currencyFormat.format(freeShippingAmountInCents / 100),
    ).replace(
      '{amount_left}',
      currencyFormat.format(amountLeftInCents / 100),
    );

    // Finally, replace *text* with <Text emphasis="bold">text</Text>
    formattedString = formattedString.replace(
      /\*(.*?)\*/g,
      (_, p1) => `<Text emphasis="bold">${p1}</Text>`
    );

    return formattedString;
  };

  const title = hasReachedFreeShipping
    ? translate(free_shipping_reached_text ?? 'Free shipping applied')
    : translate(free_shipping_not_reached_text ?? '{amount_left} until free shipping');

  const progress = countrySpecificThreshold 
    ? Math.min(1, subTotalAmountInCents / freeShippingAmountInCents) 
    : 0;
  const cornerRadius = (corner_radius ||
    'large') as MaybeResponsiveConditionalStyle<MaybeShorthandProperty<CornerRadius>>;

  console.log('Current shipping country:', shippingAddress?.countryCode);
  console.log('Country specific threshold:', countrySpecificThreshold);
  console.log('Subtotal amount (cents):', subTotalAmountInCents);
  console.log('Free shipping amount (cents):', freeShippingAmountInCents);
  console.log('Amount left (cents):', amountLeftInCents);
  console.log('Has reached free shipping:', hasReachedFreeShipping);
  console.log('Progress:', progress);

  return (
    <BlockStack
      inlineAlignment={ (alignment || 'start') as InlineAlignment }
      spacing={ (spacing || 'extraTight') as Spacing }>
      <InlineLayout
        background="subdued"
        minBlockSize="100%"
        minInlineSize="100%"
        cornerRadius={ cornerRadius }
        columns={ [`${ progress * 100 }%`] }>
        <Image
          aspectRatio={ 528 / ((bar_height || 8) as number) * progress }
          cornerRadius={ cornerRadius }
          fit={ 'cover' }
          source={ (image_src ||
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM0K1z9HwAEigJT6jWUiAAAAABJRU5ErkJggg==') as string }
        />
      </InlineLayout>

      <Text
        size={(text_size || 'base') as TextSize}
        appearance={
          ((hasReachedFreeShipping ? text_appearance_reached : null) ||
            text_appearance ||
            'info') as TextAppearance
        }
      >
        {replaceStringValues(title).split(/<Text.*?>(.*?)<\/Text>/).map((part, index) =>
          index % 2 === 0 ? (
            part
          ) : (
            <Text key={index} emphasis="bold">
              {part}
            </Text>
          )
        )}
      </Text>
    </BlockStack>
  );
}

const getCountryFlag = (countryCode: string) => {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};