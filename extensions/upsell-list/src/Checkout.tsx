import {
  BlockStack,
  Button,
  Divider,
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
  Icon,
  Link,
  useCartLineTarget,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState, useMemo } from "react";
import useMetaObjectTranslations from './metaobject_translations';

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

type Product = {
  id: string;
  variantId: string;
  data?: any;
  loading?: boolean;
};

function Extension() {
  const fields = useAppMetafields({
    key: 'upsells_in_checkout',
    namespace: 'custom',
  });

  const [upsellIds, setUpsellIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addedProducts, setAddedProducts] = useState<{[index: number]: boolean}>({});

  const country = useLocalizationCountry() as any;
  const { query, i18n } = useApi();
  const applyCartChange = useApplyCartLinesChange();
  const cartLines = useCartLines();

  const {translate} = useMetaObjectTranslations();
  const [maisonUpsellListVisibility] = useAttributeValues(["_maisonUpsellList"]);
  
  const hideExtension = maisonUpsellListVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  let { header_text, add_to_cart, discount_percentage, remove_text, number_of_upsells } = useSettings();

  // Convert discount_percentage to a decimal for calculations
  const discountMultiplier = discount_percentage ? (100 - Number(discount_percentage)) / 100 : 1;

  const isVariantInCart = (variantId: string) => {
    return cartLines.some((line) =>
      line.merchandise.id === variantId
    );
  };

  const addToBag = async (id: string, i: number) => {
    let clone = structuredClone(products);
    clone[i].loading = true;
    setProducts(clone);

    await applyCartChange({
      type: "addCartLine",
      merchandiseId: "gid://shopify/ProductVariant/" + id.split("/").pop(),
      quantity: 1,
      attributes: [
        {
          key: "_maisonUpsell",
          value: "true"
        }
      ]
    });

    clone = structuredClone(products);
    clone[i].loading = false;
    setProducts(clone);
    
    // Mark product as added
    setAddedProducts({...addedProducts, [i]: true});
  };

  const removeFromCart = async (variantId: string, i: number) => {
    // Find the cart line that contains this specific variant
    const cartLine = cartLines.find(line => 
      line.merchandise.id === variantId
    );
    
    if (cartLine) {
      let clone = structuredClone(products);
      clone[i].loading = true;
      setProducts(clone);

      await applyCartChange({
        type: "removeCartLine",
        id: cartLine.id,
        quantity: cartLine.quantity,
      });

      clone = structuredClone(products);
      clone[i].loading = false;
      setProducts(clone);
      
      // Mark product as not added
      setAddedProducts({...addedProducts, [i]: false});
    }
  };

  const updateVariant = (newVariantId: string, i: number) => {
    const clone = structuredClone(products);
    clone[i].variantId = newVariantId;
    setProducts(clone);
    
    // Reset the added state for this index since it's a different variant now
    setAddedProducts({...addedProducts, [i]: false});
  };

  const fetchProducts = async (productIds: string[]) => {
    // Fetch all provided product IDs to ensure we have enough after filtering
    const result = await query(
      `query Products($query: String!) @inContext(country: ${country?.isoCode ?? 'en-US'}) {
        products(first: ${productIds.length}, query: $query) {
          nodes {
            id
            title
            tags
            featuredImage {
              url
            }
            variants (first: 100) {
              nodes {
                id
                title
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
          query: productIds.map(value => `(id:${value})`).join(' OR '),
        },
      });

    return result.data as any;
  };

  useEffect(() => {
    if (fields.length > 0) {
      let ids = [];
      const maxUpsells = number_of_upsells ? Number(number_of_upsells) : 3;
      // Collect extra IDs in case some products get filtered out for having 'noCheckout' tag
      const bufferMultiplier = 2; // Fetch up to 2x the max to ensure we have enough after filtering
      
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        ids = ids.concat(JSON.parse(field.metafield.value as string));

        if (ids.length >= maxUpsells * bufferMultiplier) {
          ids = ids.slice(0, maxUpsells * bufferMultiplier);
          break;
        }
      }

      setUpsellIds(ids);
    }
  }, [fields.length, number_of_upsells]);

  useEffect(() => {
    if (upsellIds.length > 0) {
      fetchProducts(
        upsellIds.map(value => value.split('/').pop()),
      ).then(result => {
        // Filter out products with 'noCheckout' tag
        const filteredProducts = result.products.nodes.filter(product => 
          !product.tags.includes('noCheckout')
        );
        
        // Limit to the max number of upsells after filtering
        const maxUpsells = number_of_upsells ? Number(number_of_upsells) : 3;
        const limitedProducts = filteredProducts.slice(0, maxUpsells);
        
        setProducts(
          limitedProducts.map(product => ({
            id: product.id,
            data: product,
            loading: false,
            variantId: product.variants.nodes[0].id
          })),
        );
      });
    }
  }, [upsellIds.length, number_of_upsells]);

  return (
    <>
      {upsellIds.length > 0 && (
        <View blockAlignment="center" padding="none">
          <BlockStack>
            {header_text && (
              <BlockStack inlineAlignment="center">
                <Text size="medium" emphasis="bold">{translate(header_text)}</Text>
              </BlockStack>
            )}
            {products.map((product, i) => {
          if (!product.data) return null;

          const variants = product.data.variants.nodes;
          const amountOfVariants = variants.length;
          const variant = variants.find((v: any) => v.id === product.variantId);
          
          // Calculate original price (to be shown as strikethrough)
          const originalPrice = variant.compareAtPrice ? 
            variant.compareAtPrice.amount : 
            variant.price.amount;
          
          // Calculate discounted price
          const discountedPrice = variant.price.amount * discountMultiplier;
          
          const displayOriginalPrice = i18n.formatCurrency(originalPrice);
          const displayDiscountedPrice = i18n.formatCurrency(discountedPrice);

          // Only show discounted price if discount percentage is set
          const showDiscount = discount_percentage && Number(discount_percentage) > 0;

          const image = variant.image
            ? variant.image.url
            : product.data.featuredImage.url;

          const variantInCart = isVariantInCart(product.variantId);

          return (
            <View key={product.data.id}>
              
              
              <InlineLayout border="base" borderRadius="base" columns={["auto", "fill", "auto"]} spacing="base" padding="base" blockAlignment="center">
                <ProductThumbnail src={image} />
                
                <BlockStack spacing="none">
                  <Text>{product.data.title}</Text>
                  
                  <InlineLayout
                    columns={["auto", "auto"]}
                    blockAlignment="center"
                    spacing="tight"
                    inlineAlignment="start"
                  >
                    {showDiscount ? (
                      <>
                        <TextBlock appearance="success">{displayDiscountedPrice}</TextBlock>
                        <Text
                          size="small"
                          appearance="critical"
                          emphasis="bold"
                          accessibilityRole="deletion"
                        >
                          {displayOriginalPrice}
                        </Text>
                      </>
                    ) : (
                      <>
                        <TextBlock appearance="success">{i18n.formatCurrency(variant.price.amount)}</TextBlock>
                        {variant.compareAtPrice && (
                          <Text
                            size="small"
                            appearance="critical"
                            emphasis="bold"
                            accessibilityRole="deletion"
                          >
                            {i18n.formatCurrency(variant.compareAtPrice.amount)}
                          </Text>
                        )}
                      </>
                    )}
                  </InlineLayout>
                  
                  {amountOfVariants > 1 && (
                    <Select
                      value={products[i].variantId}
                      onChange={(variantId) => updateVariant(variantId, i)}
                      label="Options"
                      options={variants.map((v: any) => ({
                        label: v.title,
                        value: v.id,
                      }))}
                    />
                  )}
                </BlockStack>
                
                <BlockStack spacing="extraTight" inlineAlignment="center">
                  <Button
                    onPress={() => addToBag(product.variantId.toString(), i)}
                    appearance="monochrome"
                    kind="primary"
                    disabled={variantInCart || addedProducts[i]}
                  >
                    {product.loading ? (
                      <Spinner appearance="monochrome" />
                    ) : (variantInCart || addedProducts[i]) ? (
                      <Icon source="checkmark" />
                    ) : (
                      <>{translate(add_to_cart)}</>
                    )}
                  </Button>
                  {(variantInCart || addedProducts[i]) && !product.loading && (
                    <Link 
                      onPress={() => removeFromCart(product.variantId, i)}
                      appearance="monochrome"
                    >
                      <Text size="small">{translate(remove_text) || translate('Remove')}</Text>
                    </Link>
                  )}
                </BlockStack>
              </InlineLayout>
            </View>
          );
        })}
          </BlockStack>
        </View>
      )}
    </>
  );
}
