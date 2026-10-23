import { useState } from 'react';
import { Box, Stack, Text, Title } from '@mantine/core';
import { ELEMENTS, type Element } from '../data/elements';
import { ElementCell } from './ElementCell';
import { CategoryLegend } from './CategoryLegend';
import { ElementDetail } from './ElementDetail';
import classes from './PeriodicTable.module.css';

// Owns the selected-element state and composes the legend, the scrollable grid,
// and the detail view. The dataset's xpos/ypos already place every element in
// the correct cell (including the group-2 → group-13 gap and the
// lanthanide/actinide f-block rows), so cells just read those coordinates.
export function PeriodicTable() {
  const [selected, setSelected] = useState<Element | null>(null);

  return (
    <Stack gap="md" p="md">
      <Title order={1} size="h3" ta="center">
        Periodic Table of Elements
      </Title>

      <CategoryLegend />

      <Box className={classes.scroller}>
        <Box className={classes.grid}>
          {ELEMENTS.map((element) => (
            <ElementCell
              key={element.atomicNumber}
              element={element}
              onSelect={setSelected}
            />
          ))}
        </Box>
      </Box>

      <Text size="xs" c="dimmed" ta="center" hiddenFrom="sm">
        Scroll sideways to see the full table.
      </Text>

      <ElementDetail element={selected} onClose={() => setSelected(null)} />
    </Stack>
  );
}
