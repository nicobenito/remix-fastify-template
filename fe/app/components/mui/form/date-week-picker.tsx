import { styled } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField';
import MuiTextField from '@mui/material/TextField';
import type { DateFieldProps, PickersDayProps as MuiPickersDayProps } from '@mui/x-date-pickers';
import { DateField as MuiDateField, DatePicker, PickersDay as MuiPickersDay } from '@mui/x-date-pickers';
import { useUtils } from '@mui/x-date-pickers/internals';
import { DateTime } from 'luxon';
import type { ComponentType } from 'react';
import { useState } from 'react';

import { DateTimeFormats } from '~/constants';

const DayOfWeek = {
  Friday: 5,
  Saturday: 6,
} as const;

interface PickersDayProps extends MuiPickersDayProps<DateTime> {
  isSelected: boolean;
  isHovered: boolean;
}

const PickersDay = styled(MuiPickersDay, {
  shouldForwardProp: (prop) => prop !== 'isSelected' && prop !== 'isHovered',
})<PickersDayProps>(({ theme, isSelected, isHovered, day }) => ({
  borderRadius: 0,
  ...(isSelected && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.main,
    },
  }),
  ...(isHovered && {
    backgroundColor: theme.palette.primary[theme.palette.mode],
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary[theme.palette.mode],
    },
  }),
  ...(day.weekday === DayOfWeek.Saturday && {
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
  }),
  ...(day.weekday === DayOfWeek.Friday && {
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
})) as ComponentType<PickersDayProps>;

function getPreviousSaturday(dateTime: DateTime): DateTime {
  const daysToSubtract = (dateTime.weekday - DayOfWeek.Saturday + 7) % 7 || 7;

  return dateTime.minus({ days: dateTime.weekday === DayOfWeek.Saturday ? 0 : daysToSubtract });
}

function getNextFriday(dateTime: DateTime): DateTime {
  const daysToAdd = (DayOfWeek.Friday - dateTime.weekday + 7) % 7 || 7;

  return dateTime.plus({ days: dateTime.weekday === DayOfWeek.Friday ? 0 : daysToAdd }).endOf('day');
}

function isInSameWeek(left: DateTime, right: DateTime | null | undefined) {
  if (right == null) {
    return false;
  }

  const previousSaturday = getPreviousSaturday(right);
  const nextFriday = getNextFriday(right);

  return left >= previousSaturday.startOf('day') && left <= nextFriday.endOf('day');
}

function getRange(value: DateTime | null) {
  if (value == null) {
    return null;
  }

  return {
    from: getPreviousSaturday(value),
    to: getNextFriday(value),
  };
}

function Day(
  props: PickersDayProps & {
    selectedDay?: DateTime | null;
    hoveredDay?: DateTime | null;
  },
) {
  const { day, selectedDay, hoveredDay, ...other } = props;

  return (
    <PickersDay
      {...other}
      day={day}
      sx={{ px: 2.5 }}
      disableMargin
      selected={false}
      isSelected={isInSameWeek(day, selectedDay)}
      isHovered={isInSameWeek(day, hoveredDay)}
    />
  );
}

function TextField(props: TextFieldProps) {
  const {
    // @ts-expect-error `ownerState` is provided
    ownerState: { value },
  } = props;
  const utils = useUtils();

  const range = getRange(value);
  const text = range
    ? `${utils.formatByString(range.from, DateTimeFormats.PlatformDay)} - ${utils.formatByString(range.to, DateTimeFormats.PlatformDay)}`
    : '';

  return <MuiTextField {...props} fullWidth value={text} />;
}

function DateField<TDate extends DateTime<boolean>, TEnableAccessibleFieldDOMStructure extends boolean>(
  props: DateFieldProps<TDate, TEnableAccessibleFieldDOMStructure>,
) {
  return <MuiDateField {...props} slots={{ textField: TextField }} />;
}

type DateWeekPickerProps = {
  name: string;
};

export function DateWeekPicker({ name }: DateWeekPickerProps) {
  const [hoveredDay, setHoveredDay] = useState<DateTime | null>(null);
  const [value, setValue] = useState<DateTime | null>(DateTime.now().startOf('day'));
  const range = getRange(value);
  const utils = useUtils();

  return (
    <>
      <DatePicker
        value={value}
        onChange={(newValue) => {
          if (newValue !== null) {
            setValue(newValue.startOf('day'));
          }
        }}
        showDaysOutsideCurrentMonth
        slots={{
          // @ts-expect-error check type
          day: Day,
          field: DateField,
        }}
        slotProps={{
          day: (ownerState) => ({
            selectedDay: value,
            hoveredDay,
            onPointerEnter: () => setHoveredDay(ownerState.day),
            onPointerLeave: () => setHoveredDay(null),
          }),
          textField: {
            fullWidth: true,
            size: 'small',
          },
        }}
      />
      <input
        type="hidden"
        name={`${name}.from`}
        value={range?.from ? utils.formatByString(range?.from, DateTimeFormats.Date) : ''}
      />
      <input
        type="hidden"
        name={`${name}.to`}
        value={range?.to ? utils.formatByString(range?.to, DateTimeFormats.Date) : ''}
      />
    </>
  );
}
