import { useAuth } from "@clerk/clerk-expo";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";
import { useEffect } from "react";

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
}: PaymentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const {
    userAddress,
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationAddress,
    destinationLongitude,
  } = useLocationStore();
  const { userId } = useAuth();
  const [success, setSuccess] = useState<boolean>(false);

  const openPaymentSheet = async () => {
    console.log("🚀 Opening payment sheet...");
    await initializePaymentSheet();

    console.log("📌 Presenting payment sheet...");
    const { error } = await presentPaymentSheet();

    if (error) {
      console.error("❌ Payment Sheet Error:", error);
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      console.log("✅ Payment successful!");
      setSuccess(true);
    }
  };

  const initializePaymentSheet = async () => {
    console.log("🛠 Initializing payment sheet...");
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Example, Inc.",
      intentConfiguration: {
        mode: {
          amount: parseInt(amount) * 100,
          currencyCode: "USD",
        },
        confirmHandler: async (
          paymentMethod,
          shouldSavePaymentMethod,
          intentCreationCallback
        ) => {
          console.log(
            "📝 Confirm Handler Triggered. Creating Payment Intent..."
          );
          console.log("💳 Payment Method ID:", paymentMethod.id);

          const { paymentIntent, customer } = await fetchAPI(
            "/(api)/(stripe)/create",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: fullName || email.split("@")[0],
                email: email,
                amount: amount,
                paymentMethodId: paymentMethod.id,
              }),
            }
          );

          console.log("✅ Payment Intent Created:", paymentIntent);

          if (paymentIntent.client_secret) {
            console.log("🔄 Processing payment...");
            const { result } = await fetchAPI("/(api)/(stripe)/pay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payment_method_id: paymentMethod.id,
                payment_intent_id: paymentIntent.id,
                customer_id: customer,
                client_secret: paymentIntent.client_secret,
              }),
            });

            console.log("✅ Payment Processing Response:", result);

            if (result.client_secret) {
              console.log("🚖 Creating ride...");
              await fetchAPI("/(api)/ride/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  origin_address: userAddress,
                  destination_address: destinationAddress,
                  origin_latitude: userLatitude,
                  origin_longitude: userLongitude,
                  destination_latitude: destinationLatitude,
                  destination_longitude: destinationLongitude,
                  ride_time: rideTime.toFixed(0),
                  fare_price: parseInt(amount) * 100,
                  payment_status: "paid",
                  driver_id: driverId,
                  user_id: userId,
                }),
              });

              console.log("✅ Ride Created!");
              intentCreationCallback({ clientSecret: result.client_secret });
            }
          }
        },
      },
      returnURL: "myapp://book-ride",
    });

    if (error) {
      console.error("❌ Error Initializing Payment Sheet:", error);
    }
  };
  useEffect(() => {
    console.log("🔄 Проверяем API /api/stripe/create...");

    fetch("http://192.168.0.106:3000/api/stripe/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        amount: 5000,
        paymentMethodId: "pm_1R7NCRIR7eMbw3uv4CnsJtpI",
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("✅ API Response:", data))
      .catch((err) => console.error("❌ API Error:", err));
  }, []);
  return (
    <>
      <CustomButton
        title="Confirm Ride"
        className="my-10"
        onPress={openPaymentSheet}
      />

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Booking placed successfully
          </Text>
          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Thank you for your booking. Your reservation has been successfully
            placed. Please proceed with your trip.
          </Text>
          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </>
  );
};

export default Payment;
