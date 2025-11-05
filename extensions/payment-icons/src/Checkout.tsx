import {
  reactExtension,
  PaymentIcon,
  InlineStack,
  useSettings,
  Banner,
  useCartLineTarget,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";
import {useMemo} from 'react';
import useMetaObjectTranslations from "./metaobject_translations";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const settings = useSettings();
  const { translate } = useMetaObjectTranslations();
  const [maisonPaymentIconsVisibility] = useAttributeValues(["_maisonPaymentIcons"]);
  
  const hideExtension = maisonPaymentIconsVisibility === "false";
  
  if (hideExtension) {
    return null;
  }
  
  console.log("Full settings:", settings);
  console.log("Methods from settings:", settings.methods);

  // Fallback payment methods
  const fallbackMethods = "ideal,visa,mastercard,discover,amex,paypal,klarna,jcb,unionpay,maestro";

  // Get the translated value first
  const translatedMethods = translate(settings.methods) || fallbackMethods;
  console.log("Translated methods:", translatedMethods);

  // Now split the translated methods
  const methodsArray = translatedMethods.split(',').map(method => method.trim());
  console.log("Methods array:", methodsArray);

  if (methodsArray.length === 0) {
    return (
      <Banner
        status="critical"
        title={translate("Please enter at least one payment method")}
      ></Banner>
    );
  }

  return (
    <InlineStack
      blockAlignment={"center"}
      inlineAlignment={"center"}
      spacing="base"
    >
      {methodsArray.map((method, i) => (
        <PaymentIcon key={i} name={method} />
      ))}
    </InlineStack>
  );
}
