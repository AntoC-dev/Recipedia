const MEASURE_LAYOUT_MODULE = '@shopify/flash-list/dist/recyclerview/utils/measureLayout';

const parentLayout = { x: 0, y: 0, width: 400, height: 900 };
const itemLayout = { x: 0, y: 0, width: 100, height: 100 };

export function flashListMeasureLayoutMock() {
  return {
    ...jest.requireActual(MEASURE_LAYOUT_MODULE),
    measureParentSize: jest.fn(() => parentLayout),
    measureFirstChildLayout: jest.fn(() => parentLayout),
    measureItemLayout: jest.fn(() => itemLayout),
  };
}
