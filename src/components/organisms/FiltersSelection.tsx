/**
 * FiltersSelection - Active filter display with toggle functionality
 *
 * A compact component that displays currently active filters as removable tags
 * with a toggle button to switch between filter selection and results view.
 * Features horizontal scrolling for multiple filters and intuitive filter management.
 *
 * Key Features:
 * - Horizontal scrollable list of active filters
 * - Removable filter tags with cross icons
 * - Mode toggle button (add filters vs view results)
 * - Dynamic button text and icons based on mode
 * - Responsive layout with proper spacing
 * - Internationalization support
 *
 * @example
 * ```typescript
 * // Basic filter selection display
 * const [filtersMode, setFiltersMode] = useState(false);
 * const [activeFilters, setActiveFilters] = useState(['vegetarian']);
 *
 * <FiltersSelection
 *   testId="recipe-filters"
 *   filters={activeFilters}
 *   addingFilterMode={filtersMode}
 *   setAddingAFilter={setFiltersMode}
 *   onRemoveFilter={(filter) => {
 *     setActiveFilters(filters.filter(f => f !== filter));
 *   }}
 * />
 *
 * // Integration with search results
 * <FiltersSelection
 *   testId="search-filters"
 *   filters={appliedFilters}
 *   addingFilterMode={showFilterPanel}
 *   setAddingAFilter={setShowFilterPanel}
 *   onRemoveFilter={handleFilterRemoval}
 * />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { TagButton } from '@components/atomic/TagButton';
import { FilterToggleButton } from '@components/atomic/FilterToggleButton';
import { Icons } from '@assets/Icons';
import { useI18n } from '@utils/i18n';
import { TUTORIAL_DEMO_INTERVAL, TUTORIAL_STEPS } from '@utils/Constants';
import { FlatList, View } from 'react-native';
import { padding } from '@styles/spacing';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { CopilotStepData } from '@customTypes/TutorialTypes';
import { listFilter, prepTimeValues } from '@customTypes/RecipeFiltersTypes';

/** Frame cap for the spotlight measure-until-stable loop, so it cannot spin forever */
const MAX_MEASURE_ATTEMPTS = 30;

/**
 * Props for the FiltersSelection component
 */
export type FiltersSelectionProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Array of currently active filter strings */
  filters: string[];
  /** Whether the component is in filter-adding mode */
  addingFilterMode: boolean;
  /** State setter for toggling filter adding mode */
  setAddingAFilter: React.Dispatch<React.SetStateAction<boolean>>;
  /** Callback fired when a filter is removed */
  onRemoveFilter: (filter: string) => void;
  /** Reports the window-space top (px) of the filter toggle button when it lays out */
  onToggleButtonTop?: (windowTop: number) => void;
  /** Whether the host screen is focused; re-measures the toggle button on focus */
  screenFocused?: boolean;
};

/**
 * FiltersSelection component for active filter management
 *
 * @param props - The component props with filter state and management functions
 * @returns JSX element representing active filters with toggle functionality
 */
export function FiltersSelection({
  testId,
  filters,
  addingFilterMode,
  setAddingAFilter,
  onRemoveFilter,
  onToggleButtonTop,
  screenFocused,
}: FiltersSelectionProps) {
  const { t } = useI18n();
  const copilotData = useSafeCopilot();
  const copilotEvents = copilotData?.copilotEvents;
  const currentStep = copilotData?.currentStep;

  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toggleButtonRef = useRef<View>(null);
  const reducedMotion = useReducedMotion();

  const stepOrder = TUTORIAL_STEPS.Search.order;
  const selectionTestID = testId + '::FiltersSelection';

  const getDisplayText = (filterValue: string): string => {
    if (prepTimeValues.includes(filterValue) || filterValue === listFilter.inSeason) {
      return t(filterValue);
    }
    return filterValue;
  };

  const triggerToggle = () => {
    setAddingAFilter(prev => !prev);
  };

  useEffect(() => {
    if (!copilotData || !copilotEvents) {
      return;
    }

    const startDemo = () => {
      if (reducedMotion) {
        return;
      }
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
      demoIntervalRef.current = setInterval(() => {
        setAddingAFilter(prev => !prev);
      }, TUTORIAL_DEMO_INTERVAL);
    };

    const stopDemo = () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      setAddingAFilter(false);
    };

    const handleStepChange = (step: CopilotStepData | undefined) => {
      if (step?.order === stepOrder) {
        startDemo();
      } else {
        stopDemo();
      }
    };

    // Start demo if we're already on our step when component mounts
    if (currentStep?.order === stepOrder) {
      startDemo();
    }

    copilotEvents.on('stepChange', handleStepChange);
    copilotEvents.on('stop', stopDemo);

    return () => {
      copilotEvents.off('stepChange', handleStepChange);
      copilotEvents.off('stop', stopDemo);
      stopDemo();
    };
  }, [currentStep, copilotData, copilotEvents, reducedMotion, stepOrder, setAddingAFilter]);

  // On focus during the tutorial, the screen is still mid-transition (the
  // spotlight target moves as the safe area settles), so a single measurement
  // can be stale. Measure each frame until the window position stops changing,
  // then report the settled value. Deterministic (ends when layout is stable),
  // capped so it cannot spin forever, and only runs while the tutorial is active.
  useEffect(() => {
    if (!screenFocused || !copilotData) {
      return;
    }
    let cancelled = false;
    let previousTop: number | null = null;
    let attempts = 0;
    let frame = requestAnimationFrame(function measureUntilStable() {
      toggleButtonRef.current?.measureInWindow((_x, y) => {
        if (cancelled) {
          return;
        }
        if ((previousTop !== null && y === previousTop) || attempts >= MAX_MEASURE_ATTEMPTS) {
          onToggleButtonTop?.(y);
        } else {
          previousTop = y;
          attempts += 1;
          frame = requestAnimationFrame(measureUntilStable);
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [screenFocused, copilotData, onToggleButtonTop]);

  return (
    <>
      <FlatList
        horizontal={true}
        data={filters}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          padding: padding.verySmall,
          marginLeft: padding.small,
        }}
        renderItem={({ item, index }) => (
          <TagButton
            key={index}
            text={getDisplayText(item)}
            testID={selectionTestID + '::' + index}
            rightIcon={Icons.crossIcon}
            onPressFunction={() => onRemoveFilter(item)}
          />
        )}
      />

      <FilterToggleButton
        ref={toggleButtonRef}
        testID={testId + '::FiltersToggleButtons'}
        addingFilterMode={addingFilterMode}
        onToggle={triggerToggle}
      />
    </>
  );
}
