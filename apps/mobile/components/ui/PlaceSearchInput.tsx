import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { placesApi, PlaceResult } from '../../lib/api/places.api';
import { Search, MapPin } from 'lucide-react-native';

interface PlaceSearchInputProps {
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
}

export function PlaceSearchInput({ onSelect, placeholder }: PlaceSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setLoading(true);
        const data = await placesApi.searchPlaces(query);
        setResults(data);
        setLoading(false);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place: PlaceResult) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSelect(place);
  };

  return (
    <View className="z-50 w-full">
      <View className="flex-row items-center bg-surface-3 rounded-xl px-4 py-2 border border-border-subtle shadow-sm">
        <Search size={18} color="#94A3B8" />
        <TextInput
          className="flex-1 ml-2 font-body text-text-primary text-[14px]"
          placeholder={placeholder || "Search for a stop..."}
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          onFocus={() => query.length > 2 && setShowResults(true)}
        />
        {loading && <ActivityIndicator size="small" color="#0AADA8" />}
      </View>

      {showResults && results.length > 0 && (
        <View className="absolute top-12 left-0 right-0 bg-surface-2 border border-border-default rounded-xl shadow-xl z-[60] mt-1 overflow-hidden">
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                className="flex-row items-center px-4 py-3 border-b border-border-subtle active:bg-surface-3"
              >
                <MapPin size={16} color="#0AADA8" className="mr-3" />
                <View className="flex-1">
                  <Text className="font-body font-bold text-text-primary text-[14px]" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="font-body text-text-tertiary text-[11px]" numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false} // Small list, fits in absolute container
          />
        </View>
      )}
    </View>
  );
}
