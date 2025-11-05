import {
  Banner,
  BlockStack,
  Checkbox,
  Icon,
  Image,
  InlineLayout,
  InlineStack,
  Pressable,
  Text,
  View,
  reactExtension,
  useApi,
  useApplyCartLinesChange,
  useCartLines,
  useLocalizationCountry,
  useSettings,
  useCartLineTarget,
  useAttributeValues,
} from '@shopify/ui-extensions-react/checkout';
import {useEffect, useState, useMemo} from 'react';
import useMetaObjectTranslations from './metaobject_translations';

export default reactExtension('purchase.checkout.block.render', () => (
  <Extension/>
));

function Extension() {
  const country = useLocalizationCountry();
  const lines = useCartLines();
  const {i18n, query} = useApi();
  const [variant, setVariant] = useState(null);
  const [checked, setChecked] = useState(true);
  const applyCartChange = useApplyCartLinesChange();
  const {translate} = useMetaObjectTranslations();
  const [maisonCheckboxUpsellWithAmountVisibility] = useAttributeValues(["_maisonCheckboxUpsellWithAmount"]);
  
  const hideExtension = maisonCheckboxUpsellWithAmountVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  const {
    variant_reference,
    upsell_text,
    upsell_text_size,
    upsell_text_appearance,
    text1,
    text1_size,
    text1_appearance,
    text2,
    text2_size,
    text2_appearance,
    text3,
    text3_size,
    text3_appearance,
    img,
    text_spacing,
    img_size,
    img_border_radius,
    border,
    border_radius,
    guarantee_price
  } = useSettings();

  const merchandiseId = variant_reference || 'gid://shopify/ProductVariant/8966566609193';

  useEffect(() => {
    query(`query @inContext(country: ${(country as any).isoCode}) {
      node(id: "${merchandiseId}") {
        ... on ProductVariant {
          id
          title
          price {
            currencyCode
            amount
          }
        }
      }
    }`).then((result) => {
      const data = result.data as any;

      if (!data.node) return;
      const newVariant = data.node;
      setVariant(newVariant);

      let added = false;
      for (const line of lines) {
        if (line.merchandise.id === newVariant.id) {
          added = true;
          break;
        }
      }

      if (checked && !added) {
        applyCartChange({
          type: 'addCartLine',
          merchandiseId: newVariant.id,
          quantity: 1,
        });
      }
    });
  }, []);

  useEffect(() => {
    const isItemInCart = lines.some(line => line.merchandise.id === variant?.id);
    setChecked(isItemInCart);
  }, [lines, variant]);

  if (!variant) return null;

  const formattedPrice = i18n.formatCurrency(Number((variant as any).price.amount));
  const guaranteePriceFmt = i18n.formatCurrency(Number(guarantee_price || 0));

  const replacePricePlaceholders = (text: string) => {
    if (!text) return text;
    return text
      .replace(/\{guaranteePriceFmt\}/g, guaranteePriceFmt)
      .replace(/\{formattedPrice\}/g, formattedPrice);
  };

  return (
    <BlockStack>
      <InlineLayout columns={['fill', 'auto']}>
        <InlineStack>
          <Text
            appearance={upsell_text_appearance || 'info'}
            emphasis="bold"
            size={upsell_text_size || 'base'}
          >
            {replacePricePlaceholders(translate(upsell_text))}
          </Text>
        </InlineStack>
      </InlineLayout>
      <Pressable
        border="dotted"
        borderRadius="large"
        padding='base'
        minInlineSize="100%"
        minBlockSize="100%"
        onPress={() => {
          const newCheckedState = !checked;
          setChecked(newCheckedState);

          if (newCheckedState) {
            applyCartChange({
              type: 'addCartLine',
              merchandiseId: (variant as any).id,
              quantity: 1,
            });
          } else {
            const lineToRemove = lines.find(line => line.merchandise.id === (variant as any).id);
            if (lineToRemove) {
              applyCartChange({
                type: 'removeCartLine',
                id: lineToRemove.id,
                quantity: 999,
              });
            }
          }
        }}
      >
        <BlockStack>
          <InlineLayout columns={[(img_size || 64) as number, 'fill']} spacing="base">
            <Image
              borderRadius={img_border_radius || 'none'}
              source={img || 'https://cdn.shopify.com/s/files/1/0742/1896/3239/files/SHIPPINGINSURANCE_128x128.png?v=1694604320'}
            />
            <BlockStack spacing={text_spacing || 'extraTight'}>
              <InlineLayout columns={['fill', 'auto']}>
                {text1 && (
                  <Text
                    appearance={text1_appearance || 'info'}
                    size={text1_size || 'base'}
                    emphasis="bold"
                  >
                    {replacePricePlaceholders(translate(text1) || 'Shipping insurance')}
                  </Text>
                )}
                <Checkbox checked={checked}/>
              </InlineLayout>

                <Text
                  appearance={text2_appearance || 'info'}
                  size={text2_size || 'small'}
                >
                  {replacePricePlaceholders(translate(text2) || `from Damage, Loss & Theft for`)}
                </Text>

              {text3 && (
                <Text
                  appearance={text3_appearance || 'info'}
                  size={text3_size || 'small'}
                >
                  {replacePricePlaceholders(translate(text3) ||
                    `Get peace of mind with HeyShape's Delivery Guarantee in the event your delivery is damaged, stolen or lost during transit up to`)}
                </Text>
              )}
            </BlockStack>
          </InlineLayout>
        </BlockStack>
      </Pressable>
    </BlockStack>
  );
}