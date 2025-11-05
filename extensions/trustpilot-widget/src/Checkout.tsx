import {
  BlockStack,
  Image,
  InlineLayout,
  ScrollView,
  Text,
  TextBlock,
  View,
  reactExtension,
  useSettings,
  useCartLineTarget,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";
import {useMemo} from 'react';

import useMetaObjectTranslations from "./metaobject_translations";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

type Review = {
  title: string;
  body: string;
  name: string;
  timeAgo: string;
  rating: "4" | "5";
};

function Extension() {
  const { reviews_json, footer_text, toml_text, logo_image_url } = useSettings();
  const { translate } = useMetaObjectTranslations();
  const [maisonTrustpilotWidgetVisibility] = useAttributeValues(["_maisonTrustpilotWidget"]);
  
  const hideExtension = maisonTrustpilotWidgetVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  // Parse reviews from settings or use default if unavailable
  const reviews: Review[] = reviews_json
    ? reviews_json.split('\n').map((line: string) => {
        const [title, body, name, timeAgo, rating] = line.split(':');
        return {
          title: translate(title.trim()),
          body: translate(body.trim()),
          name: translate(name.trim()),
          timeAgo: translate(timeAgo.trim()),
          rating: rating?.trim() as "4" | "5"
        };
      })
    : [
        {
          title: translate("Very comfortable"),
          body: translate("Saw this product on TikTok and the girl did not lie. I wore this under my dress on a date night, very comfortable, no panty line shown and it holds the tummy in really good"),
          name: translate("Eva B."),
          timeAgo: translate("2 days ago"),
          rating: "5"
        },
        {
          title: translate("Loved it!"),
          body: translate("This is the best bodysuit I have tried by a million miles, and I plan to purchase in every color! I have a DDD chest and the fact that I didn't had to wear a bra felt amazing and the waist was snaaaaatched!!"),
          name: translate("Chelsea"),
          timeAgo: translate("4 days ago"),
          rating: "4"
        },
        {
          title: translate("Items arrived on time and well packed…"),
          body: translate("Items arrived on time and well packed was informed every step of the way by email when they would be arriving."),
          name: translate("Marie"),
          timeAgo: translate("17 hours ago"),
          rating: "5"
        },
        {
          title: translate("So soooo good!!"),
          body: translate("Looks sooo good! I was a little skeptical but there was this adorable sick girl in one of their ads with a REAL body that it made me have to try!"),
          name: translate("Christene Magin"),
          timeAgo: translate("3 days ago"),
          rating: "5"
        },
        {
          title: translate("Deal of a life time…"),
          body: translate("I ordered the buy one get one free deal as a late Christmas gift for myself and I love the way I feel when I put them on."),
          name: translate("Eva Teresita Gonzalez"),
          timeAgo: translate("3 hours ago"),
          rating: "5"
        },
      ];

  return (
    <BlockStack inlineAlignment="center">
      <View
        maxInlineSize={300}
        minInlineSize={300}
        padding={["none", "none", "tight", "none"]}
      >
        <InlineLayout columns={[300]} blockAlignment="center" inlineAlignment="center" spacing="base">
        
          <Image source={logo_image_url || "https://cdn.shopify.com/s/files/1/0659/6676/8379/files/Figma_2024-07-18_13.36.47.png?v=1721302624"} />
          
        </InlineLayout>
      </View>
      <InlineLayout columns={["100%"]}>
        <ScrollView
          scrollTo={0}
          minBlockSize="fill"
          maxInlineSize="fill"
          direction="inline"
          hint="innerShadow"
        >
          <InlineLayout spacing="base" blockAlignment="start">
            {reviews.map((review, i) => (
              <View
                key={i}
                minInlineSize={240}
                maxInlineSize={240}
                padding="base"
                border="base"
                borderRadius="base"
              >
                <BlockStack spacing="extraTight">
                  <View minInlineSize={100} maxInlineSize={100}>
                    <Image 
                      source={
                        review.rating === "5" 
                          ? "https://cdn.shopify.com/s/files/1/0719/8470/9689/files/Arc_2025-10-18_16.07.45.png?v=1760789345"  // 5-star image
                          : "https://cdn.shopify.com/s/files/1/0807/7715/0808/files/test.svg?v=1734326832" // 4-star image
                      } 
                    />
                  </View>
                  <Text emphasis="bold">{review.title}</Text>
                  <Text>{review.body}</Text>
                  <Text emphasis="italic" appearance="subdued">
                    {review.name}, {review.timeAgo}
                  </Text>
                </BlockStack>
              </View>
            ))}
          </InlineLayout>
        </ScrollView>
      </InlineLayout>

      <TextBlock inlineAlignment="center">
        {translate(footer_text || "Showing our 4 & 5 star reviews.")}
      </TextBlock>
    </BlockStack>
  );
}