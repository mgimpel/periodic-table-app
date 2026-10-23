import { Box, Group, Paper, Text } from '@mantine/core';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type ElementCategory,
} from '../data/element';

// Legend mapping each category to its color swatch + label. Wraps on narrow
// screens so it stays usable on phones.
export function CategoryLegend() {
  const categories = Object.keys(CATEGORY_LABELS) as ElementCategory[];
  return (
    <Group gap="xs" wrap="wrap" justify="center">
      {categories.map((category) => (
        <Paper key={category} withBorder px="xs" py={4} radius="sm">
          <Group gap={6} wrap="nowrap">
            <Box
              w={14}
              h={14}
              style={{
                backgroundColor: CATEGORY_COLORS[category],
                borderRadius: 3,
                flexShrink: 0,
              }}
            />
            <Text size="xs">{CATEGORY_LABELS[category]}</Text>
          </Group>
        </Paper>
      ))}
    </Group>
  );
}
