import {
  BlockStack,
  Image,
  InlineLayout,
  Text,
  TextBlock,
  View,
  reactExtension,
  useSettings,
  InlineAlignment,
  BlockLayout,
  useCartLineTarget,
  useAttributeValues,
} from '@shopify/ui-extensions-react/checkout';
import type {
  Appearance,
  Columns,
  Spacing,
} from '@shopify/ui-extensions/src/surfaces/checkout/components/shared';
import {
  TextSize,
} from '@shopify/ui-extensions/build/ts/surfaces/checkout/components/shared';
import useMetaObjectTranslations from './metaobject_translations';
import {useMemo} from 'react';

export default reactExtension('purchase.checkout.block.render', () => (
  <Extension/>
));

type UspItem = {
  title: string;
  body: string | null;
  img_url: string | null;
}

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
  const {
    heading,
    heading_alignment,
    heading_size,
    heading_appearance,
    usps_text,
    img_url1,
    img_url2,
    img_url3,
    spacing,
    spacing_icon_text,
    alignment,
    icon_position,
    icon_size,
    title_appearance,
    body_appearance,
    title_size,
    body_size,
  } = useSettings();

  const { translate } = useMetaObjectTranslations();
  const [maisonInfoUspsVisibility] = useAttributeValues(["_maisonInfoUsps"]);
  
  const hideExtension = maisonInfoUspsVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  const items: UspItem[] = (usps_text as string).split(/\r?\n|\r|\n/g).map((value, index) => {
    const [title, body] = value.split(':');
    return {
      title: title.trim(),
      body: body ? body.trim() : null,
      img_url: [img_url1, img_url2, img_url3][index],
    };
  });

  return (
    <BlockStack>
      <BlockLayout inlineAlignment={ heading_alignment || 'start' }>
        { heading && (
          <Text
            size={ heading_size || 'base' }
            appearance={ heading_appearance || 'info' }
          >{ translate(heading) }</Text>
        ) }
      </BlockLayout>
      <BlockStack inlineAlignment={ alignment as InlineAlignment || 'start' }
                  spacing={ spacing as Spacing || 'tight' }>
        {
          items.map((item, index) => (
            <UspItem
              key={ index }
              item={ {
                title: translate(item.title),
                body: item.body ? translate(item.body) : null,
                img_url: item.img_url,
              } }
              spacing={ (spacing_icon_text || null) as Spacing | null }
              iconPosition={ (icon_position || 'start') as 'start' | 'end' }
              iconSize={ (icon_size || 20) as number }
              titleAppearance={ (title_appearance || 'info') as TextAppearance }
              bodyAppearance={ (body_appearance || 'info') as TextAppearance }
              titleSize={ (title_size || 'medium') as TextSize }
              bodySize={ (body_size || 'small') as TextSize }
            />
          ))
        }
      </BlockStack>
    </BlockStack>
  );
}

function UspItem({
  item,
  iconPosition,
  iconSize,
  spacing,
  titleAppearance,
  bodyAppearance,
  titleSize,
  bodySize,
}: {
  item: UspItem,
  iconPosition: 'start' | 'end',
  spacing: Spacing | null,
  iconSize: number,
  titleAppearance: TextAppearance,
  bodyAppearance: TextAppearance,
  titleSize: TextSize,
  bodySize: TextSize,
}) {
  const icon = <View maxInlineSize={ iconSize }>
    <Image
      source={ (item.img_url || 'https://i.imgur.com/jlrOoUm.png') as string }/>
  </View>;

  const columns: Columns = [
    iconPosition === 'start' ? iconSize : 'fill',
    iconPosition === 'end' ? iconSize : 'fill',
  ];

  return (
    <InlineLayout
      blockAlignment="center"
      columns={ columns }
      spacing={ spacing || 'tight' }
    >
      { iconPosition === 'start' && icon }
      <BlockStack spacing="none">
        <Text appearance={ titleAppearance } size={ titleSize }>{ item.title }</Text>
        { item.body && (
          <TextBlock 
            size={ bodySize }
            appearance={ bodyAppearance }
            inlineAlignment="start"
          >
            { item.body }
          </TextBlock>
        ) }
      </BlockStack>
      { iconPosition === 'end' && icon }
    </InlineLayout>
  );
}