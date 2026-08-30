import geopandas as gpd
import numpy as np
import rasterio

def compute_slope_aspect(elevation_matrix, cell_size=30.0):
    # Compute surface gradients along vertical and horizontal axes
    dy, dx = np.gradient(elevation_matrix, cell_size)
    
    # Calculate slope in degrees
    slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
    slope_deg = np.degrees(slope_rad)
    
    # Calculate aspect (compass direction in degrees)
    aspect_rad = np.arctan2(-dy, dx)
    aspect_deg = np.degrees(aspect_rad)
    aspect_deg = np.where(aspect_deg < 0, 90.0 - aspect_deg, 360.0 - aspect_deg + 90.0)
    aspect_deg = aspect_deg % 360.0
    
    return slope_deg, aspect_deg

def extract_all_features():
    print("Loading elevation raster...")
    dem_path = "data/terrain/N27E088.hgt"
    gdf = gpd.read_file("data/landslides/sikkim/sikkim_landslides_combined.geojson")
    
    with rasterio.open(dem_path) as src:
        dem_data = src.read(1).astype(float)
        transform = src.transform
        
        # Calculate slope and aspect matrices using NumPy
        print("Computing slope and aspect surfaces with NumPy...")
        slope_matrix, aspect_matrix = compute_slope_aspect(dem_data)
        
        elevations, slopes, aspects = [], [], []
        
        print("Sampling terrain features for all 510 coordinates...")
        for x, y in zip(gdf.longitude, gdf.latitude):
            # Convert spatial coordinates to raster pixel indices
            row, col = src.index(x, y)
            
            # Safeguard against out-of-bound indices
            row = np.clip(row, 0, dem_data.shape[0] - 1)
            col = np.clip(col, 0, dem_data.shape[1] - 1)
            
            elevations.append(float(dem_data[row, col]))
            slopes.append(float(slope_matrix[row, col]))
            aspects.append(float(aspect_matrix[row, col]))
            
    gdf['elevation_m'] = elevations
    gdf['slope_deg'] = slopes
    gdf['aspect_deg'] = aspects
    
    # Clean zero or negative nodata artifacts
    gdf['elevation_m'] = gdf['elevation_m'].apply(lambda v: max(v, 0.0))
    
    out_path = "data/landslides/sikkim/sikkim_landslides_features.geojson"
    gdf.to_file(out_path, driver="GeoJSON")
    
    print("\n=== TERRAIN FEATURE EXTRACTION COMPLETE ===")
    print(gdf[['is_landslide', 'longitude', 'latitude', 'elevation_m', 'slope_deg', 'aspect_deg']].head(5))
    print(f"\nSaved features to: {out_path}")

if __name__ == "__main__":
    extract_all_features()
