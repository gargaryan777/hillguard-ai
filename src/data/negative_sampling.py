import geopandas as gpd
import numpy as np
from shapely.geometry import Point

def generate_negative_samples(geojson_path: str, num_samples: int = 255):
    print("Loading positive landslide polygons...")
    pos_df = gpd.read_file(geojson_path)
    
    # Get total bounding box
    minx, miny, maxx, maxy = pos_df.total_bounds
    
    # Dissolve polygons to check for spatial intersection
    combined_landslides = pos_df.geometry.union_all()
    
    neg_points = []
    print(f"Generating {num_samples} non-landslide points within bounds...")
    
    while len(neg_points) < num_samples:
        random_lon = np.random.uniform(minx, maxx)
        random_lat = np.random.uniform(miny, maxy)
        pt = Point(random_lon, random_lat)
        
        # Keep point only if it does NOT fall inside known landslide zones
        if not combined_landslides.contains(pt):
            neg_points.append(pt)
            
    neg_df = gpd.GeoDataFrame(
        {'is_landslide': [0] * num_samples}, 
        geometry=neg_points, 
        crs=pos_df.crs
    )
    
    out_path = "data/landslides/sikkim/negative_samples.geojson"
    neg_df.to_file(out_path, driver="GeoJSON")
    print(f"Successfully generated {len(neg_df)} non-landslide points!")
    print(f"Saved to: {out_path}")

if __name__ == "__main__":
    geojson_path = "data/landslides/sikkim/cleaned_landslides.geojson"
    generate_negative_samples(geojson_path, num_samples=255)
