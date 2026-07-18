export function imageCropPickerMock() {
  return { openCamera: jest.fn(), openCropper: jest.fn(), openPicker: jest.fn() };
}
