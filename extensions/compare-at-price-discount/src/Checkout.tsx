import {
  InlineLayout,
  Text,
  reactExtension,
  useApi,
  useCartLines,
  useLocalizationCountry,
  useSettings,
  useCartLineTarget,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";
import { useRef, useState, useMemo } from "react";
import { useInterval } from "./useInterval";

import useMetaObjectTranslations from './metaobject_translations';

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { query, i18n } = useApi();
  const { text } = useSettings();
  const items = useCartLines();
  const totalItems = useRef(0);
  const country = useLocalizationCountry();
  const [savings, setSavings] = useState(0);
  const {translate} = useMetaObjectTranslations();
  const [maisonCompareAtPriceDiscountVisibility] = useAttributeValues(["_maisonCompareAtPriceDiscount"]);
  
  const hideExtension = maisonCompareAtPriceDiscountVisibility === "false";
  
  if (hideExtension) {
    return null;
  }
  useInterval(async () => {
    const currentItemAmount = items.reduce(
      (prev, curr) => prev + curr.quantity,
      0,
    );

    if (totalItems.current !== currentItemAmount) {
      let totalCompareAtPrice = 0;
      let totalActualPrice = 0;

      for (const item of items) {
        const id = item.merchandise.product.id;
        const product = await queryProduct(id);

        const variant = product.variants.nodes.find(
          (v: any) => v.id === item.merchandise.id,
        );

        const comparePrice = variant.compareAtPrice 
          ? Number(variant.compareAtPrice.amount) 
          : Number(variant.price.amount);
        
        const actualPrice = Number(item.cost.totalAmount.amount) / item.quantity;

        totalCompareAtPrice += comparePrice * item.quantity;
        totalActualPrice += actualPrice * item.quantity;
      }

      const totalSavings = totalCompareAtPrice - totalActualPrice;
      setSavings(totalSavings > 0 ? totalSavings : 0);
    }

    totalItems.current = currentItemAmount;
  }, 1000);

  const queryProduct = async (id: string) => {
    const result =
      await query(`query @inContext(country: ${country ? country.isoCode : "US"})  {
      product(id: "${id}") {
        variants(first: 100) {
          nodes {
            id
            title
            price {
              currencyCode
              amount
            }
            compareAtPrice {
              currencyCode
              amount
            }
          }
        }
        id
      }
    }`);

    const data = result.data as any;

    return data.product;
  };

  const formattedSavings = i18n.formatCurrency(savings);

  return savings > 0 ? (
    <InlineLayout columns={["fill", "auto"]} id="compare-at-price-discount-block">
      <Text emphasis="bold" appearance="success">{translate(text) || "You're Saving"}</Text>
      <Text emphasis="bold" appearance="success">{formattedSavings}</Text>
    </InlineLayout>
  ) : null;
}
