import {
  BlockStack,
  Button,
  InlineLayout,
  ProductThumbnail,
  Select,
  Spinner,
  Text,
  TextBlock,
  View,
  reactExtension,
  useApi,
  useApplyCartLinesChange,
  useCartLines,
  useLocalizationCountry,
  useSettings,
  useAppMetafields,
  useCartLineTarget,
  useAttributeValues,
} from '@shopify/ui-extensions-react/checkout';
import {useEffect, useState, useMemo} from 'react';
import useMetaObjectTranslations from './metaobject_translations';

export default reactExtension('purchase.checkout.block.render', () => (
    <Extension/>
));

type Product = {
  id: string;
  variantId: string;
  data?: any;
  loading?: boolean;
};

function Extension() {
  const fields = useAppMetafields({
    key: 'upsell_products',
    namespace: 'custom',
  });

  const [upsellIds, setUpsellIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const country = useLocalizationCountry();
  const {query, i18n} = useApi();
  const applyCartChange = useApplyCartLinesChange();
  const cartLines = useCartLines();

  const { translate } = useMetaObjectTranslations();
  const [maisonMetafieldUpsellsVisibility] = useAttributeValues(["_maisonMetafieldUpsells"]);
  
  const hideExtension = maisonMetafieldUpsellsVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  let {add_text} = useSettings();

  const isMetafieldProductInCart = (productIds: string[]) => {
    return cartLines.some((line) =>
      productIds.includes(line.merchandise.product.id)
    );
  };

  const addToBag = async (id: string, i: number) => {
    let clone = structuredClone(products);
    clone[i].loading = true;
    setProducts(clone);

    await applyCartChange({
      type: 'addCartLine',
      merchandiseId: 'gid://shopify/ProductVariant/' + id.split('/').pop(),
      quantity: 1,
    });

    clone = structuredClone(products);
    clone[i].loading = false;
    setProducts(clone);
  };

  const updateVariant = (newVariantId: string, i: number) => {
    const clone = structuredClone(products);
    clone[i].variantId = newVariantId;
    setProducts(clone);
  };

  const fetchProducts = async (productIds: string[]) => {
    const result = await query(
        `query Products($query: String!) @inContext(country: ${ country?.isoCode ??
        'en-US' }) {
      products(first: 3, query: $query) {
        nodes {
          id
          title
          featuredImage {
            url
          }
          variants (first: 100) {
            nodes {
              id
              title
              availableForSale
              image {
                url
              }
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }`, {
          variables: {
            query: productIds.map(value => `(id:${ value })`).join(' OR '),
          },
        });

    return result.data as any;
  };

  useEffect(() => {
    if (fields.length > 0) {
      let ids = [];
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        ids = ids.concat(JSON.parse(field.metafield.value));

        if (ids.length > 3) {
          break;
        }
      }

      setUpsellIds(ids);
    }
  }, [fields.length]);

  useEffect(() => {
    if (upsellIds.length > 0) {
      fetchProducts(
          upsellIds.map(value => value.split('/').pop()),
      ).then(result => {
        setProducts(
            result.products.nodes.map(product => ({
              id: product.id,
              data: product,
              loading: false,
              variantId: product.variants.nodes[0].id
            })),
        );
      });
    }
  }, [upsellIds.length]);

  return (
    <>
      {upsellIds.length > 0 && !isMetafieldProductInCart(upsellIds) && (
      <BlockStack>
        { products.map((product, i) => {
          if (!product.data) return null;

          const variants = product.data.variants.nodes;
          const amountOfVariants = variants.length;
          const variant = variants.find((v) => v.id === product.variantId);
          const variantPrice = i18n.formatCurrency(variant.price.amount);

          let variantComparePrice = null;

          if (variant.compareAtPrice && variant.compareAtPrice.amount) {
            variantComparePrice = i18n.formatCurrency(
                variant.compareAtPrice.amount,
            );
          }

          const image = variant.image
              ? variant.image?.url
              : product.data.featuredImage?.url;

          return (
              <View key={ product.data.id } padding="base" border="base"
                    borderRadius="large">
                <InlineLayout columns={ ['100%', 'auto'] }>
                  <InlineLayout
                      padding={ ['none', 'base', 'none', 'none'] }
                      columns={ ['auto', 'auto'] }
                      spacing="base"
                      blockAlignment="center"
                      inlineAlignment="start"
                  >
                    <ProductThumbnail src={ image }/>
                    <BlockStack spacing="extraTight">
                      <TextBlock>
                        { translate(product.data.title) }

                        <InlineLayout
                            columns={ ['auto', 'auto'] }
                            blockAlignment={ 'center' }
                            spacing={ 'tight' }
                        >
                          <TextBlock
                              appearance="success">{ variantPrice }</TextBlock>

                          { variantComparePrice && (
                              <Text
                                  size="small"
                                  appearance="critical"
                                  emphasis="bold"
                                  accessibilityRole="deletion"
                              >
                                { variantComparePrice }
                              </Text>
                          ) }
                        </InlineLayout>
                      </TextBlock>

                      { amountOfVariants > 1 ? (
                          <Select
                              value={ products[i].variantId }
                              onChange={ (variantId) => updateVariant(variantId,
                                  i) }
                              label={ translate("Options") }
                              options={ variants.map((v: any) => ({
                                label: `${ translate(v.title) } (${ i18n.formatCurrency(
                                    v.price.amount,
                                ) })`,
                                value: v.id,
                              })) }
                          />
                      ) : null }
                    </BlockStack>
                  </InlineLayout>
                  <View inlineAlignment="end" blockAlignment="center">
                    <Button
                        onPress={ () => addToBag(product.variantId.toString(),
                            i) }
                        appearance="monochrome"
                        kind="primary"
                    >
                      { product.loading ? (
                          <Spinner appearance="monochrome"/>
                      ) : (
                          <Text size="small">{ translate(add_text) || translate('Add to bag') }</Text>
                      ) }
                    </Button>
                  </View>
                </InlineLayout>
              </View>
          );
        }) }
      </BlockStack>
      )}
    </>
  );
}