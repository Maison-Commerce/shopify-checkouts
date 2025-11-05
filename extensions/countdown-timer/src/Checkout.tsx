import {
  Banner,
  View,
  reactExtension,
  useStorage,
  useSettings,
  useCartLineTarget,
  useAttributeValues,
} from '@shopify/ui-extensions-react/checkout';
import {useEffect, useState, useMemo} from 'react';
import useMetaObjectTranslations from './metaobject_translations';

export default reactExtension('purchase.checkout.block.render', () => (
  <Extension/>
));

function Extension() {
  const {
    banner_expired,   // Text for expired banner
    banner_countdown, // Text for countdown banner
    banner_status,
    banner_title,     // New setting for banner title
  } = useSettings();

  const { translate } = useMetaObjectTranslations();
  const storage = useStorage();
  const [timer, setTimer] = useState(600); // Default timer value
  const [maisonCountdownTimerVisibility] = useAttributeValues(["_maisonCountdownTimer"]);
  
  const hideExtension = maisonCountdownTimerVisibility === "false";
  
  if (hideExtension) {
    return null;
  }

  const syncTimeToStorage = async () => {
    const time = await storage.read('order-reservation-time');
    if (time) {
      const timeNumber = Number(time);
      setTimer(timeNumber <= 0 ? 600 : timeNumber);
    }
  };

  const updateTimeInStorage = async (seconds) => {
    await storage.write('order-reservation-time', seconds);
  };

  useEffect(() => {
    syncTimeToStorage();

    const id = setInterval(() => {
      setTimer((t) => {
        const newTime = t - 1;
        updateTimeInStorage(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearTimeout(id);
  }, []);

  const secondsToTimeString = (seconds) => {
    if (seconds < 0) return translate(banner_expired || 'YOUR ORDER RESERVATION ENDED');
    
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    const formattedRemainder = remainder.toString().padStart(2, '0');
    
    const countdownText = translate(banner_countdown || 'Order reserved for the next');
    
    // Check if the text contains placeholders and replace them
    if (countdownText.includes('{min}') && countdownText.includes('{sec}')) {
      return countdownText.replace('{min}', minutes.toString())
                         .replace('{sec}', formattedRemainder);
    }
    
    // Fall back to original format if no placeholders
    return `${countdownText} ${minutes}:${formattedRemainder}`;
  };

  return (
    <View>
      <Banner
        {...(banner_title ? { title: translate(banner_title) } : {})}
        status={banner_status || 'success'}
      >
        {secondsToTimeString(timer)}
      </Banner>
    </View>
  );
}