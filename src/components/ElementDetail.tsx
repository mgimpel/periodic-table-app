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
import { buildElectronShellDiagram } from "../lib/electronShellDiagram";

interface ElementDetailProps {
  element: Element | null;
  onClose: () => void;
}

// Render the element's Bohr shell diagram. The pure generator returns an SVG
// string; embedding it as a data-URI <img> keeps the markup isolated (no inline
// DOM injection) and lets it scale responsively. Elements with no shells (none
// in the shipped data, but the field is a plain array) render nothing.
function ElectronShellDiagram({ element }: { element: Element }) {
  if (element.shells.length === 0) return null;
  const svg = buildElectronShellDiagram(
    element.atomicNumber,
    element.symbol,
    element.electronConfigurationSemantic,
    element.shells,
    CATEGORY_COLORS[element.category],
  );
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return (
    <img
      src={src}
      alt={`Electron shell diagram for ${element.name}`}
      width={200}
      height={200}
      style={{ flex: "0 0 auto" }}
    />
  );
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
          <SimpleGrid cols={2} spacing="sm">
            <DetailRow label="Phase" value={element.phase} />
            <DetailRow
              label="Density"
              value={
                element.density !== null
                  ? `${element.density}${
                      element.densityUnit ? ` ${element.densityUnit}` : ""
                    }`
                  : "—"
              }
            />
            <DetailRow
              label="Boiling point"
              value={element.boil !== null ? `${element.boil} K` : "—"}
            />
            <DetailRow
              label="Melting point"
              value={element.melt !== null ? `${element.melt} K` : "—"}
            />
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="electron" pt="md">
          <Group gap="md" align="flex-start" wrap="nowrap">
            <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
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
              <DetailRow
                label="Electron affinity"
                value={
                  element.electronAffinity !== null
                    ? `${element.electronAffinity} kJ/mol`
                    : "—"
                }
              />
            </Stack>
            <ElectronShellDiagram element={element} />
          </Group>
        </Tabs.Panel>

        <Tabs.Panel value="description" pt="md">
          <Stack gap="sm">
            {element.appearance && (
              <DetailRow label="Appearance" value={element.appearance} />
            )}
            {element.discoveredBy && (
              <DetailRow label="Discovered by" value={element.discoveredBy} />
            )}
            {element.namedBy && (
              <DetailRow label="Named by" value={element.namedBy} />
            )}
            <Text size="sm">
              {element.summary || "No description available."}
            </Text>
          </Stack>
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
