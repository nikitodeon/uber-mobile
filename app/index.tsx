// import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";

const Page = () => {
  // const { isSignedIn } = useAuth();

  // if (isSignedIn) return <Redirect href="/(root)/(tabs)/home" />;

  return (
    // <View className="bg-red-500">
    //   {/* <View style={{ backgroundColor: "red", flex: 1 }}> */}
    //   <Text>jjj</Text>
    // </View>
    <Redirect href="/(auth)/welcome" />
  );
};

export default Page;
