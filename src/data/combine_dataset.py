import geopandas as gpd
import pandas as pd

def combine_positive_negative():
    print("Loading datasets...")
    pos_df = gpd.read_file("data/landslides/sikkim/cleaned_landslides.geojson")
    neg_df = gpd.read_file("data/landslides/sikkim/negative_samples.geojson")
    
    # Label positive class
    pos_df['is_landslide'] = 1
    
    # Re-project to UTM Zone 45N (meters) for accurate centroid calculation, then transform back to WGS84
    pos_df['geometry'] = pos_df.geometry.to_crs("EPSG:32645").centroid.to_crs("EPSG:4326")
    
    # Standardize schema across both sets
    pos_subset = pos_df[['is_landslide', 'geometry']]
    neg_subset = neg_df[['is_landslide', 'geometry']]
    
    # Merge datasets
    full_df = pd.concat([pos_subset, neg_subset], ignore_index=True)
    full_gdf = gpd.GeoDataFrame(full_df, geometry='geometry', crs="EPSG:4326")
    
    # Extract coordinates into explicit Lat/Lon columns
    full_gdf['longitude'] = full_gdf.geometry.x
    full_gdf['latitude'] = full_gdf.geometry.y
    
    out_path = "data/landslides/sikkim/sikkim_landslides_combined.geojson"
    full_gdf.to_file(out_path, driver="GeoJSON")
    
    print("\n=== DATASET MERGED WITHOUT WARNINGS ===")
    print(f"Total Rows      : {len(full_gdf)}")
    print(f"Landslide (1)   : {(full_gdf['is_landslide'] == 1).sum()}")
    print(f"Non-Landslide(0): {(full_gdf['is_landslide'] == 0).sum()}")
    print(f"Saved merged GeoJSON to: {out_path}")

if __name__ == "__main__":
    combine_positive_negative()
