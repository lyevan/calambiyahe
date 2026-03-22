import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import { Check, Camera, Sparkles, AlertCircle } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { hazardsApi } from "../../lib/api/hazards.api";
import { Input } from "../../components/ui/Input";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { isWithinCalamba } from "../../lib/calamba.bounds";
import { useCreateHazard } from "../../hooks/api/use-hazards";
import { MapLocationSelector } from "../../components/maps/MapLocationSelector";

const HAZARD_TYPES = [
  "Pothole",
  "Flooding",
  "Road damage",
  "Construction",
  "Other",
];
const SEVERITIES = [
  { label: "Minor", color: "#3B82F6", bg: "bg-info-surface" },
  { label: "Medium", color: "#F5A623", bg: "bg-warning-surface" },
  { label: "Severe", color: "#ef4444", bg: "bg-danger-surface" },
];

export default function ReportTab() {
  const createHazard = useCreateHazard();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [type, setType] = useState(HAZARD_TYPES[0]);
  const [otherType, setOtherType] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [desc, setDesc] = useState("");

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [isMapSelecting, setIsMapSelecting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locError, setLocError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocError("Location permission required.");
        return;
      }
      setIsGettingLocation(true);
      try {
        console.log("Getting location...");
        console.log("Location permission granted.");
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log("Location: ", loc);
        if (!isWithinCalamba(loc.coords.latitude, loc.coords.longitude)) {
          setLocError("Location is outside Calamba City.");
        } else {
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setLocError("");
        }
      } catch {
        setLocError("Failed to get location.");
      } finally {
        setIsGettingLocation(false);
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setAiAnalysis(null); // Reset analysis if new photo
    }
  };

  const handleAiAnalyze = async () => {
    if (!imageUri || !location) return;
    setIsAnalyzing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });
      const res = await hazardsApi.analyze(
        base64,
        "image/jpeg",
        location,
        desc,
      );
      setAiAnalysis(res);

      // Auto-fill everything
      if (res.severity) {
        setSeverity(
          res.severity.charAt(0).toUpperCase() + res.severity.slice(1),
        );
      }

      if (res.description) {
        setDesc(res.description);
      }

      // Try to find a matching type
      const suggestedType = HAZARD_TYPES.find(
        (t) =>
          t.toLowerCase().includes(res.hazardType.toLowerCase()) ||
          res.hazardType.toLowerCase().includes(t.toLowerCase()),
      );
      if (suggestedType) {
        setType(suggestedType);
        setOtherType("");
      } else {
        setType("Other");
        setOtherType(res.hazardType);
      }
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLocationTryAgain = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocError("Location permission required.");
      return;
    }
    try {
      console.log("Getting location...");
      console.log("Location permission granted.");
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log("Location: ", loc);
      if (!isWithinCalamba(loc.coords.latitude, loc.coords.longitude)) {
        setLocError("Location is outside Calamba City.");
      } else {
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setLocError("");
      }
    } catch {
      setLocError("Failed to get location.");
    }
  };

  const handleSubmit = async () => {
    if (!imageUri || !type || !location || locError) return;

    try {
      // Map UI types to backend enum
      const typeMap: Record<string, string> = {
        Pothole: "pothole",
        Lubak: "pothole",
        Flooding: "flood",
        "Road damage": "pothole",
        Construction: "construction",
        Other: "other",
      };

      const finalType = type === "Other" ? "other" : typeMap[type] || "other";
      const finalDesc = type === "Other" ? `[${otherType}] ${desc}` : desc;

      const formData = new FormData() as any;
      formData.append("type", finalType);
      if (type === "Other" && otherType) {
        formData.append("custom_type", otherType);
      }
      formData.append("severity", severity.toLowerCase());
      formData.append("description", finalDesc);
      formData.append("lat", Number(location.lat));
      formData.append("lng", Number(location.lng));

      const filename = imageUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("image", {
        uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
        name: filename,
        type: fileType,
      });

      console.log("Report: ", formData._parts);
      await createHazard.mutateAsync(formData);

      setIsSuccess(true);
    } catch (err: any) {
      setLocError(err.message || "Failed to submit report");
    }
  };

  if (isMapSelecting) {
    return (
      <MapLocationSelector
        onSelectCallback={(loc) => {
          setLocation(loc);
          setIsMapSelecting(false);
          setLocError("");
        }}
        onCancel={() => setIsMapSelecting(false)}
        initialLocation={location}
      />
    );
  }

  if (isSuccess) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-success-surface items-center justify-center mb-6 border border-success">
          <Check size={40} color="#1BBF74" />
        </View>
        <Text className="font-display font-bold text-3xl text-text-primary mb-2 text-center">
          Report submitted
        </Text>
        <Text className="font-body text-sm text-text-secondary text-center mb-10 px-4">
          Your report will appear on the hazard map. Others can confirm it.
        </Text>
        <View className="w-full gap-y-4">
          <Button
            label="Report another"
            onPress={() => {
              setIsSuccess(false);
              setImageUri(null);
              setDesc("");
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 24,
          paddingTop: 60,
          paddingBottom: 120,
        }}
      >
        <Text className="font-display font-bold text-3xl text-text-primary mb-2">
          Report a hazard
        </Text>
        <Text className="font-body text-text-secondary mb-8">
          Help fellow travelers by reporting road issues.
        </Text>

        {/* Photo Capture */}
        <Pressable
          onPress={pickImage}
          className="w-full h-56 bg-surface-2 border border-dashed border-border-default rounded-3xl items-center justify-center mb-8 overflow-hidden"
        >
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute bottom-4 right-4 bg-surface-2 p-3 rounded-xl shadow-lg">
                <Text className="text-text-primary text-xs font-bold">
                  Retake Photo
                </Text>
              </View>
            </>
          ) : (
            <View className="items-center">
              <View className="w-16 h-16 bg-surface-3 rounded-full items-center justify-center mb-3">
                <Camera size={32} color="#a1a1aa" />
              </View>
              <Text className="text-text-tertiary font-body">
                Tap to take a photo
              </Text>
            </View>
          )}
        </Pressable>

        {imageUri && !aiAnalysis && (
          <View className="mb-8 items-center px-6">
            <Button
              label={isAnalyzing ? "Analyzing..." : "Analyze Photo with AI"}
              variant="ghost"
              icon={isAnalyzing ? undefined : Sparkles}
              onPress={handleAiAnalyze}
              disabled={isAnalyzing || !location}
              className="w-full"
            />
            {!location && (
              <Text className="text-[10px] text-danger-500 mt-2 font-body">
                Location required for AI analysis
              </Text>
            )}
          </View>
        )}

        {aiAnalysis && (
          <View className="mb-8 p-4 bg-primary-500/5 border border-primary-500/20 rounded-2xl">
            <View className="flex-row items-center mb-2">
              <Sparkles size={16} color="#0AADA8" className="mr-2" />
              <Text className="font-display font-bold text-sm text-text-primary">
                AI Insight
              </Text>
            </View>
            <Text className="font-body text-xs text-text-secondary leading-4 mb-2">
              {aiAnalysis.description}
            </Text>
            <View className="flex-row items-center">
              <AlertCircle size={12} color="#0AADA8" className="mr-1" />
              <Text className="text-[10px] font-body text-accent italic">
                Suggested type: {aiAnalysis.hazardType} • Severity:{" "}
                {aiAnalysis.severity}
              </Text>
            </View>
          </View>
        )}

        {isGettingLocation ? (
          <View className="mb-6">
            <ActivityIndicator size="large" color="#0AADA8" />
            <Text className="text-text-secondary font-body text-center">
              Getting location...
            </Text>
          </View>
        ) : null}

        {locError ? (
          <View>
            <AlertBanner type="danger" title={locError} className="mb-6" />
          </View>
        ) : null}

        {/* Location Selection */}
        <View className="mb-8">
          <Text className="text-text-secondary font-display font-bold text-xs uppercase tracking-widest mb-3">
            Location
          </Text>
          <View className="flex-row gap-x-3 mb-3">
            <Pressable
              onPress={() => {
                setIsGettingLocation(true);
                handleLocationTryAgain().finally(() =>
                  setIsGettingLocation(false),
                );
              }}
              className="flex-1 py-3 items-center justify-center rounded-2xl border border-accent bg-accent/10"
            >
              <Text className="font-body font-medium text-accent text-center">
                Current Location
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsMapSelecting(true)}
              className="flex-1 py-3 items-center justify-center rounded-2xl border border-accent bg-accent/10"
            >
              <Text className="font-body font-medium text-accent text-center">
                Choose on Map
              </Text>
            </Pressable>
          </View>
          {location ? (
            <Text className="font-body text-xs text-text-secondary text-center">
              Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Text>
          ) : null}
        </View>

        {/* Hazard Type */}
        <View className="mb-8">
          <Text className="text-text-secondary font-display font-bold text-xs uppercase tracking-widest mb-3">
            Hazard Type
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {HAZARD_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                className={`px-6 py-3 mr-3 rounded-full border ${type === t ? "border-accent bg-accent/10" : "border-border-default bg-surface-1"}`}
              >
                <Text
                  className={`font-body font-medium ${type === t ? "text-accent" : "text-text-secondary"}`}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {type === "Other" && (
          <View className="mb-8">
            <Input
              label="Specify Hazard Type"
              placeholder="e.g. Fallen Tree, Accident..."
              value={otherType}
              onChangeText={setOtherType}
            />
          </View>
        )}

        {/* Severity */}
        <View className="mb-8">
          <Text className="text-text-secondary font-display font-bold text-xs uppercase tracking-widest mb-3">
            Severity
          </Text>
          <View className="flex-row gap-x-3">
            {SEVERITIES.map((s) => {
              const isSelected = severity === s.label;
              return (
                <Pressable
                  key={s.label}
                  onPress={() => setSeverity(s.label)}
                  className={`flex-1 items-center py-3 rounded-2xl border ${isSelected ? `border-opacity-50 ${s.bg}` : "border-border-default bg-surface-1"}`}
                  style={isSelected ? { borderColor: s.color } : {}}
                >
                  <Text
                    className={`font-body font-bold ${isSelected ? "" : "text-text-secondary"}`}
                    style={isSelected ? { color: s.color } : {}}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View className="mb-10">
          <Input
            label="Additional Details"
            placeholder="Describe the hazard to help others..."
            value={desc}
            onChangeText={setDesc}
            multiline
            style={{ minHeight: 48, maxHeight: 120 }}
            className="text-left"
          />
        </View>

        <Button
          label="Submit Hazard Report"
          onPress={handleSubmit}
          loading={createHazard.isPending}
          disabled={!imageUri || !type || !location || !!locError}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
