import {
  Badge,
  Box,
  Drawer,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Element,
} from '../data/element';

interface ElementDetailProps {
  element: Element | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <Box>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Box>
  );
}

function DetailBody({ element }: { element: Element }) {
  return (
    <Stack gap="md">
      <Group gap="sm" align="center">
        <Box
          w={56}
          h={56}
          style={{
            backgroundColor: CATEGORY_COLORS[element.category],
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1a1a1a',
          }}
        >
          <Text size="xs">{element.atomicNumber}</Text>
          <Text fw={700} size="lg">
            {element.symbol}
          </Text>
        </Box>
        <Box>
          <Title order={2} size="h4">
            {element.name}
          </Title>
          <Badge variant="light" color="gray">
            {CATEGORY_LABELS[element.category]}
          </Badge>
        </Box>
      </Group>

      <SimpleGrid cols={2} spacing="sm">
        <DetailRow label="Atomic number" value={element.atomicNumber} />
        <DetailRow label="Atomic mass" value={element.atomicMass} />
        <DetailRow label="Group" value={element.group ?? '—'} />
        <DetailRow label="Period" value={element.period} />
        <DetailRow label="Phase" value={element.phase} />
        <DetailRow label="Block" value={element.block} />
      </SimpleGrid>

      <DetailRow label="Electron configuration" value={element.electronConfiguration} />
      <DetailRow
        label="Electron configuration (semantic)"
        value={element.electronConfigurationSemantic}
      />
      <DetailRow label="Electron shells" value={element.shells.join(', ')} />

      {element.appearance && <DetailRow label="Appearance" value={element.appearance} />}
      {element.discoveredBy && (
        <DetailRow label="Discovered by" value={element.discoveredBy} />
      )}

      {element.summary && (
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase">
            Summary
          </Text>
          <Text size="sm">{element.summary}</Text>
        </Box>
      )}
    </Stack>
  );
}

// Detail view for the selected element. Mobile-first: a bottom-anchored Drawer
// on small screens, a centered Modal from the `sm` breakpoint up. Both are
// dismissable (close button, overlay click, Esc).
export function ElementDetail({ element, onClose }: ElementDetailProps) {
  const isWide = useMediaQuery('(min-width: 48em)');
  const opened = element !== null;
  const title = element ? `${element.name} (${element.symbol})` : '';

  if (isWide) {
    return (
      <Modal opened={opened} onClose={onClose} title={title} centered size="lg">
        {element && <DetailBody element={element} />}
      </Modal>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position="bottom"
      size="80%"
    >
      {element && <DetailBody element={element} />}
    </Drawer>
  );
}
