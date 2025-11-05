import {
  Banner,
  Image,
  View,
  reactExtension,
  useSettings,
  useCartLineTarget,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";
import {useMemo} from 'react';

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { image }: Partial<{ image: string }> = useSettings();
  const [maisonGenericImageVisibility] = useAttributeValues(["_maisonGenericImage"]);
  
  const hideExtension = maisonGenericImageVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  if (!image) return <Banner status="critical">Enter an image link</Banner>;

  return (
    <View>
      <Image source={image || "https://picsum.photos/1000"} />
    </View>
  );
}
