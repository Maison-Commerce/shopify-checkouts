import {
  reactExtension,
  BlockStack,
  InlineLayout,
  Image,
  Text,
  useSettings,
  View,
  useCartLineTarget,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState, useMemo } from "react";

export default reactExtension("purchase.checkout.block.render", () => <Extension />);

function Extension() {
  const {
    initial_stock = 50,
    update_interval = 45,
    min_decrease = 1,
    max_decrease = 3,
    bar_height = 8,
    corner_radius = "base",
    text_size = "base",
    text_appearance = "info",
    image_src,
    stock_text = "LIVE STOCK UPDATES: {stock} left in stock"
  } = useSettings();

  const [currentStock, setCurrentStock] = useState(initial_stock);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [maisonStockBarVisibility] = useAttributeValues(["_maisonStockBar"]);
  
  const hideExtension = maisonStockBarVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeDiff = now - lastUpdateTime;
      
      if (timeDiff >= update_interval * 1000) {
        setCurrentStock(prev => {
          const decrease = Math.floor(Math.random() * (max_decrease - min_decrease + 1)) + min_decrease;
          return Math.max(8, prev - decrease);
        });
        setLastUpdateTime(now);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTime, update_interval, min_decrease, max_decrease]);

  const progress = Math.max(0, currentStock / initial_stock);

  return (
    <View border="base"  borderRadius="large" padding="base">
      <BlockStack spacing="tight" inlineAlignment="center">
        <InlineLayout 
          blockAlignment="center" 
          spacing="tight"
          inlineAlignment="center"
          columns={[10, "fill"]}
        >
          <Image 
            source="https://cdn.shopify.com/s/files/1/0274/4601/8115/files/test-gif-dot.gif?v=1734620243"
            inlineSize={10}
            blockSize={10}
            maxInlineSize={10}
            maxBlockSize={10}
          />
          <Text
            size={text_size}
            appearance={text_appearance}
          >
            {stock_text.replace("{stock}", currentStock.toString())}
          </Text>
        </InlineLayout>

        <InlineLayout
          background="subdued"
          minBlockSize="100%"
          minInlineSize="100%"
          cornerRadius={corner_radius}
          columns={[`${progress * 100}%`]}
        >
          <Image
            aspectRatio={528 / bar_height * progress}
            cornerRadius={corner_radius}
            fit="cover"
            source={image_src || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM0K1z9HwAEigJT6jWUiAAAAABJRU5ErkJggg=='}
          />
        </InlineLayout>
      </BlockStack>
    </View>
  );
}