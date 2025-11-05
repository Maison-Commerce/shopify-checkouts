import {useEffect, useState} from 'react';
import {
  useApi,
  useLocalizationCountry,
} from '@shopify/ui-extensions-react/checkout';

export default function useMetaObjectTranslations() {
  const [translations, setTranslations] = useState<any>(null);
  const {query} = useApi();
  const country = useLocalizationCountry();

  useEffect(() => {
    query(
        `query @inContext(country: ${ country?.isoCode }) {
        metaobjects(type: "maison_checkout_reviews_translation", first: 200) {
          nodes {
            id
            type
            handle
            field(key: "value") {
              value
            }
          }
        }
      }`).then(({data, errors}) => {
      setTranslations(data);
    });
  }, [query, country]);

  const translate = (value: any) => {
    if (!value) return null;

    const key = value?.replaceAll('{', '')?.replaceAll('}', '');
    return translations?.metaobjects?.nodes?.find(
        (node: any) => node.handle === key)?.field?.value ?? value;
  };

  return {translations, translate};
}