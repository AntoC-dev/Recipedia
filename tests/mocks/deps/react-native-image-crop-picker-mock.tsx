export const openCamera = jest.fn().mockResolvedValue({
  path: 'file:///mock/camera/image.jpg',
  width: 1024,
  height: 768,
  mime: 'image/jpeg',
});

export const openPicker = jest.fn().mockResolvedValue({
  path: 'file:///mock/gallery/image.jpg',
  width: 1024,
  height: 768,
  mime: 'image/jpeg',
});

export const openCropper = jest.fn().mockResolvedValue({
  path: 'file:///mock/cropped/image.jpg',
  width: 512,
  height: 512,
  mime: 'image/jpeg',
});

export const clean = jest.fn().mockResolvedValue(undefined);

export default {
  openCamera,
  openPicker,
  openCropper,
  clean,
};
