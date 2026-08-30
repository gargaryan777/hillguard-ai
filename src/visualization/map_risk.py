import geopandas as gpd
import joblib
import folium
from folium.plugins import MarkerCluster

def generate_risk_map():
    print("Loading dataset and trained Random Forest model...")
    gdf = gpd.read_file("data/landslides/sikkim/sikkim_landslides_features.geojson")
    model = joblib.load("src/models/random_forest_sikkim.joblib")
    
    feature_cols = ['longitude', 'latitude', 'elevation_m', 'slope_deg', 'aspect_deg']
    X = gdf[feature_cols]
    
    # Predict landslide probability (risk score)
    print("Computing predicted landslide risk scores...")
    gdf['risk_score'] = model.predict_proba(X)[:, 1]
    
    # Calculate map center location
    center_lat = gdf.latitude.mean()
    center_lon = gdf.longitude.mean()
    
    # Initialize Folium Map with Satellite Tile Layer
    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=11,
        tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri World Imagery'
    )
    
    # Color helper function based on risk probability
    def get_color(score):
        if score > 0.7:
            return 'red'
        elif score > 0.4:
            return 'orange'
        else:
            return 'green'
            
    # Add Feature Group for Points
    marker_cluster = MarkerCluster(name="Landslide Risk Clusters").add_to(m)
    
    for _, row in gdf.iterrows():
        actual_label = "Landslide (Historical)" if row['is_landslide'] == 1 else "Non-Landslide"
        risk_pct = row['risk_score'] * 100
        
        popup_content = f"""
        <div style="font-family: Arial, sans-serif; width: 180px;">
            <b>Status:</b> {actual_label}<br>
            <b>Predicted Risk:</b> <span style="color:{get_color(row['risk_score'])};"><b>{risk_pct:.1f}%</b></span><br><br>
            <b>Elevation:</b> {row['elevation_m']:.0f} m<br>
            <b>Slope:</b> {row['slope_deg']:.1f}°<br>
            <b>Aspect:</b> {row['aspect_deg']:.1f}°
        </div>
        """
        
        folium.CircleMarker(
            location=[row['latitude'], row['longitude']],
            radius=6,
            popup=folium.Popup(popup_content, max_width=220),
            color=get_color(row['risk_score']),
            fill=True,
            fill_color=get_color(row['risk_score']),
            fill_opacity=0.8
        ).add_to(marker_cluster)
        
    out_map = "sikkim_landslide_risk_map.html"
    m.save(out_map)
    print(f"\n=== INTERACTIVE RISK MAP CREATED ===")
    print(f"Map successfully saved to: {out_map}")

if __name__ == "__main__":
    generate_risk_map()
