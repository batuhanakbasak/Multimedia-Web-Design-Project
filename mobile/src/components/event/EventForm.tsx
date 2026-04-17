import DateTimePicker from '@react-native-community/datetimepicker';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { EVENT_CATEGORIES } from '../../constants/api';
import { theme } from '../../constants/theme';
import type { ClubItem } from '../../types/club';
import type { OrganizerEventFormValues } from '../../utils/validators';
import { formatDateTime } from '../../utils/formatDate';

import { FilterChip } from '../common/FilterChip';
import { AppInput } from '../forms/AppInput';

interface EventFormProps {
  control: Control<OrganizerEventFormValues>;
  errors: FieldErrors<OrganizerEventFormValues>;
  isEdit?: boolean;
  clubOptions?: ClubItem[];
}

export const EventForm = ({
  control,
  errors,
  isEdit = false,
  clubOptions = [],
}: EventFormProps) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="club_id"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Club connection</Text>
            <View style={styles.chips}>
              <FilterChip label="Independent" active={!value} onPress={() => onChange('')} />
              {clubOptions.map((club) => (
                <FilterChip
                  key={club.id}
                  label={club.name}
                  active={value === String(club.id)}
                  onPress={() => onChange(String(club.id))}
                />
              ))}
            </View>
            <Text style={styles.helperText}>
              {clubOptions.length
                ? 'Only clubs you belong to can be selected.'
                : 'No available club was found. You can still create the event without a club.'}
            </Text>
            {errors.club_id?.message ? (
              <Text style={styles.errorText}>{errors.club_id.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="Title"
            value={value}
            onChangeText={onChange}
            placeholder="AI Workshop"
            error={errors.title?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="Description"
            value={value}
            onChangeText={onChange}
            placeholder="Describe the event details"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            error={errors.description?.message}
            style={styles.multiline}
          />
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chips}>
              {EVENT_CATEGORIES.map((category) => (
                <FilterChip
                  key={category}
                  label={category}
                  active={value === category}
                  onPress={() => onChange(category)}
                />
              ))}
            </View>
            {errors.category?.message ? (
              <Text style={styles.errorText}>{errors.category.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="event_date"
        render={({ field: { value, onChange } }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Event date</Text>
            <Pressable style={styles.dateTrigger} onPress={() => setShowPicker(true)}>
              <Text style={styles.dateValue}>{value ? formatDateTime(value) : 'Select a date'}</Text>
            </Pressable>
            {errors.event_date?.message ? (
              <Text style={styles.errorText}>{errors.event_date.message}</Text>
            ) : null}
            {showPicker ? (
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    onChange(selectedDate.toISOString());
                  }

                  if (Platform.OS !== 'ios') {
                    setShowPicker(false);
                  }
                }}
              />
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="Location"
            value={value}
            onChangeText={onChange}
            placeholder="Engineering Hall"
            error={errors.location?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="image_url"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="Image URL"
            value={value}
            onChangeText={onChange}
            placeholder="https://example.com/event.jpg"
            autoCapitalize="none"
            error={errors.image_url?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="quota"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="Quota"
            value={value}
            onChangeText={onChange}
            keyboardType="number-pad"
            placeholder="100"
            error={errors.quota?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="map_link"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="Map link"
            value={value}
            onChangeText={onChange}
            placeholder="https://maps.example.com/..."
            autoCapitalize="none"
            error={errors.map_link?.message}
          />
        )}
      />

      {isEdit ? (
        <Controller
          control={control}
          name="status"
          render={({ field: { value, onChange } }) => (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.chips}>
                {['active', 'completed', 'cancelled'].map((status) => (
                  <FilterChip
                    key={status}
                    label={status}
                    active={value === status}
                    onPress={() => onChange(status)}
                  />
                ))}
              </View>
            </View>
          )}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  fieldBlock: {
    gap: 10,
  },
  fieldLabel: {
    color: theme.colors.text,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
  },
  helperText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateTrigger: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dateValue: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 16,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 13,
  },
  multiline: {
    minHeight: 120,
  },
});
