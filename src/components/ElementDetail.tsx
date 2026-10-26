// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import {
  Badge,
  Box,
  Drawer,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Element,
} from "../data/element";

interface ElementDetailProps {
  element: Element | null;
  onClose: () => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
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
          w={32}
          h={32}
          style={{
            backgroundColor: CATEGORY_COLORS[element.category],
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1a1a1a",
          }}
        >
          <Text fw={700} size="lg" style={{ lineHeight: 1, paddingTop: 4 }}>
            {element.symbol}
          </Text>
        </Box>
        <Group gap="xs" align="center">
          <Text span c="dimmed">
            {element.atomicNumber}
          </Text>
          <Title order={2} size="h4">
            {element.name}
          </Title>
          <Badge variant="light" color="gray">
            {CATEGORY_LABELS[element.category]}
          </Badge>
        </Group>
      </Group>

      <Tabs
        defaultValue="atomic"
        styles={{
          // Keep all tabs on one line without scrolling: let each tab shrink
          // and truncate its label with an ellipsis instead of overflowing.
          tab: {
            minWidth: 0,
            paddingInline: "var(--mantine-spacing-xs)",
          },
          tabLabel: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            // Nudge the label down so the full glyph height is visible.
            paddingTop: 2,
          },
        }}
      >
        <Tabs.List
          grow
          aria-label="Element detail sections"
          style={{ flexWrap: "nowrap" }}
        >
          <Tabs.Tab value="atomic">Atomic details</Tabs.Tab>
          <Tabs.Tab value="physical">Physical properties</Tabs.Tab>
          <Tabs.Tab value="chemical">Chemical properties</Tabs.Tab>
          <Tabs.Tab value="electron">Electron configuration</Tabs.Tab>
          <Tabs.Tab value="description">Description</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="atomic" pt="md">
          <SimpleGrid cols={2} spacing="sm">
            <DetailRow label="Atomic number" value={element.atomicNumber} />
            <DetailRow label="Atomic mass" value={element.atomicMass} />
            <DetailRow label="Group" value={element.group ?? "—"} />
            <DetailRow label="Period" value={element.period} />
            <DetailRow label="Block" value={element.block} />
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="physical" pt="md">
          <Stack gap="sm">
            <DetailRow label="Phase" value={element.phase} />
            {element.appearance && (
              <DetailRow label="Appearance" value={element.appearance} />
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="chemical" pt="md">
          <Stack gap="sm">
            <DetailRow
              label="Category"
              value={CATEGORY_LABELS[element.category]}
            />
            {element.discoveredBy && (
              <DetailRow label="Discovered by" value={element.discoveredBy} />
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="electron" pt="md">
          <Stack gap="sm">
            <DetailRow
              label="Electron configuration"
              value={element.electronConfiguration}
            />
            <DetailRow
              label="Electron configuration (semantic)"
              value={element.electronConfigurationSemantic}
            />
            <DetailRow
              label="Electron shells"
              value={element.shells.join(", ")}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="description" pt="md">
          <Text size="sm">
            {element.summary || "No description available."}
          </Text>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

// Detail view for the selected element. Mobile-first: a bottom-anchored Drawer
// on small screens, a centered Modal from the `sm` breakpoint up. Both are
// dismissable (close button, overlay click, Esc).
export function ElementDetail({ element, onClose }: ElementDetailProps) {
  const isWide = useMediaQuery("(min-width: 48em)");
  const opened = element !== null;

  if (isWide) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        centered
        size="lg"
        withCloseButton={false}
      >
        {element && <DetailBody element={element} />}
      </Modal>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="80%"
      closeButtonProps={{ "aria-label": "Close" }}
    >
      {element && <DetailBody element={element} />}
    </Drawer>
  );
}
