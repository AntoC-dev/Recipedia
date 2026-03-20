export const mockAssetFromModule = jest.fn().mockReturnValue({ uri: 'mocked-asset-uri' });
export const mockAssetLoadAsync = jest.fn().mockResolvedValue([]);

export function expoAssetMock() {
  return {
    Asset: {
      fromModule: mockAssetFromModule,
      loadAsync: mockAssetLoadAsync,
    },
  };
}
