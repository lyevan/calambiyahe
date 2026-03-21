import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('leaflet', () => ({
  __esModule: true,
  default: {
    divIcon: () => ({}),
  },
}));

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  LayerGroup: ({ children }) => <div>{children}</div>,
  Circle: ({ children }) => <div>{children}</div>,
}));

test('renders role selection title', () => {
  render(<App />);
  const heading = screen.getByText(/sino ka ngayon\?/i);
  expect(heading).toBeInTheDocument();
});
