// app/(citizen)/report.tsx
import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Image, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useReportHazard } from "../../hooks/api/use-hazards";
import { Button } from "../../components/ui/Button";
import { Camera, MapPin, AlertTriangle, CloudRain, Construction } from "lucide-react-native";

export default function CitizenReport() {
  const router = useRouter();
  const [type, setType] = useState<"pothole" | "flood" | "other">("pothole");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const { mutate: report, isPending } = useReportHazard();

  useEffect(() => {
    (async () => {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "We need camera access to take a photo");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!location) {
      Alert.alert("Error", "Bukas ang iyong GPS para ma-tag ang lokasyon.");
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("description", description);
    formData.append("lat", location.coords.latitude.toString());
    formData.append("lng", location.coords.longitude.toString());

    if (image) {
      const filename = image.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const ext = match ? `image/${match[1]}` : `image`;
      formData.append("image", { uri: image, name: filename, type: ext } as any);
    }

    report(formData, {
      onSuccess: () => {
        Alert.alert("Tagumpay!", "Salamat sa iyong report. Ini-review na ito ng Admin.", [
          { text: "OK", onPress: () => router.replace("/") }
        ]);
      },
      onError: (err: any) => {
        Alert.alert("System Error", err.message);
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">I-report ang Hazard</Text>
        <Text className="text-gray-500 mb-8">Tulungan ang ibang motorista sa Calamba</Text>

        <Text className="text-gray-700 font-bold mb-4">Anong klaseng hazard?</Text>
        <View className="flex-row space-x-3 mb-8">
          <TypeCard 
            active={type === "pothole"} 
            onPress={() => setType("pothole")} 
            label="Lubak" 
            icon={<Construction size={24} color={type === "pothole" ? "#2563eb" : "#6b7280"} />}
          />
          <TypeCard 
            active={type === "flood"} 
            onPress={() => setType("flood")} 
            label="Baha" 
            icon={<CloudRain size={24} color={type === "flood" ? "#2563eb" : "#6b7280"} />}
          />
          <TypeCard 
            active={type === "other"} 
            onPress={() => setType("other")} 
            label="Iba pa" 
            icon={<AlertTriangle size={24} color={type === "other" ? "#2563eb" : "#6b7280"} />}
          />
        </View>

        <Text className="text-gray-700 font-bold mb-4">Larawan (Opsyonal)</Text>
        <TouchableOpacity 
          onPress={pickImage}
          className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center mb-8 overflow-hidden"
        >
          {image ? (
            <Image source={{ uri: image }} className="w-full h-full" />
          ) : (
            <>
              <Camera size={32} color="#9ca3af" />
              <Text className="text-gray-400 mt-2">I-tap para kumuha ng litrato</Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-gray-700 font-bold mb-4">Karagdagang Impormasyon</Text>
        <TextInput
          className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-8 min-h-[100]"
          placeholder="I-describe ang hazard..."
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <View className="flex-row items-center mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
          <MapPin size={20} color="#2563eb" className="mr-3" />
          <Text className="text-blue-800 flex-1">
            {location ? "Awtomatikong naka-tag ang iyong lokasyon." : "Kinukuha ang iyong lokasyon..."}
          </Text>
        </View>

        <Button 
          title="I-submit ang Report" 
          onPress={handleSubmit} 
          loading={isPending}
        />
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

function TypeCard({ active, onPress, label, icon }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-1 items-center p-4 rounded-2xl border-2 ${active ? "bg-blue-50 border-blue-500" : "bg-white border-gray-100"}`}
    >
      <View className="mb-2">{icon}</View>
      <Text className={`font-bold ${active ? "text-blue-600" : "text-gray-500"}`}>{label}</Text>
    </TouchableOpacity>
  );
}
