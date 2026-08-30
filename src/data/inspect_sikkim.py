import geopandas as gpd

def inspect_dataset():
    file_path = "data/landslides/sikkim/Google_Earth_landslides_polygon_21Dec2021.shp"
    df = gpd.read_file(file_path)
    
    print("=== DATASET OVERVIEW ===")
    print(f"Total Polygons : {len(df)}")
    print(f"CRS            : {df.crs}")
    print(f"Bounding Box   : {df.total_bounds}\n")
    
    print("=== FEATURE COLUMNS ===")
    for col in df.columns:
        print(f" - {col}")
        
    print("\n=== SAMPLE DATA (FIRST 3 ROWS) ===")
    print(df.drop(columns='geometry').head(3).to_string())

if __name__ == "__main__":
    inspect_dataset()
