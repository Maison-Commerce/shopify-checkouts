import {
  reactExtension,
  Link,
  Text,
  useApplyCartLinesChange,
  useCartLineTarget,
  Spinner,
  useSettings,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useMemo } from "react";

export default reactExtension(
  "purchase.checkout.cart-line-item.render-after",
  () => <RemoveLineItem />
);

function RemoveLineItem() {
  const applyCartLinesChange = useApplyCartLinesChange();
  const cartLine = useCartLineTarget();
  const [isLoading, setIsLoading] = useState(false);
  const { variant_reference, remove_line_item } = useSettings();
  const [maisonRemoveShippingItemVisibility] = useAttributeValues(["_maisonRemoveShippingItem"]);
  
  const hideExtension = maisonRemoveShippingItemVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  const handleRemoveItem = async () => {
    if (!cartLine) {
      console.error('Cart line is undefined');
      return;
    }

    setIsLoading(true);
    try {
      const result = await applyCartLinesChange({
        type: 'removeCartLine',
        id: cartLine.id,
        quantity: cartLine.quantity
      });
      
      if (result.type === 'error') {
        console.error('Failed to remove item:', result.message);
      }
    } catch (error) {
      console.error('An error occurred while removing the item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!cartLine || cartLine.merchandise.id !== variant_reference) {
    return null;
  }

  return (
    <Link
      appearance="monochrome"
      onPress={isLoading ? undefined : handleRemoveItem}
    >
      {isLoading ? (
        <Spinner size="small" />
      ) : (
        <Text appearance="subdued" size="small">
          {remove_line_item || 'Remove'}
        </Text>
      )}
    </Link>
  );
}