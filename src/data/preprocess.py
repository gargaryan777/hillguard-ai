import geopandas as gpd

def clean_sikkim_data(input_path: str, output_path: str):
    print("Loading raw shapefile...")
    df = gpd.read_file(input_path)
    
    # Rename key columns for clarity
    df = df.rename(columns={
        'Name': 'slide_type',
        'descriptio': 'year',
        'Area': 'area_sqm',
        'Slope': 'slope_deg',
        'Aspect': 'aspect_deg',
        'Curvature': 'curvature',
        'Elevation': 'elevation_m',
        'Geology': 'geology'
    })
    
    # Clean string columns
    df['year'] = df['year'].astype(str).str.strip()
    df['slide_type'] = df['slide_type'].astype(str).str.strip()
    
    # Select relevant columns for modeling
    clean_df = df[[
        'slide_type', 'year', 'area_sqm', 'slope_deg', 
        'aspect_deg', 'curvature', 'elevation_m', 'geology', 'geometry'
    ]]
    
    # Save cleaned vector data
    clean_df.to_file(output_path, driver="GeoJSON")
    print(f"Successfully processed {len(clean_df)} records!")
    print(f"Saved cleaned GeoJSON to: {output_path}")

if __name__ == "__main__":
    raw_path = "data/landslides/sikkim/Google_Earth_landslides_polygon_21Dec2021.shp"
    out_path = "data/landslides/sikkim/cleaned_landslides.geojson"
    clean_sikkim_data(raw_path, out_path)
