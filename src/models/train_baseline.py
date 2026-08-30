import geopandas as gpd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

def train_model():
    print("Loading feature dataset...")
    df = gpd.read_file("data/landslides/sikkim/sikkim_landslides_features.geojson")
    
    # Define feature set and target label
    feature_cols = ['longitude', 'latitude', 'elevation_m', 'slope_deg', 'aspect_deg']
    X = df[feature_cols]
    y = df['is_landslide']
    
    # Split 80% train / 20% test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("Training Random Forest Classifier on terrain features...")
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)[:, 1]
    
    print("\n=== MODEL PERFORMANCE METRICS ===")
    print(classification_report(y_test, predictions))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, probabilities):.4f}")
    
    # Display Feature Importance
    print("\n=== FEATURE IMPORTANCE RANKING ===")
    importances = model.feature_importances_
    for col, imp in sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True):
        print(f" - {col:12s}: {imp:.4f}")
        
    # Save model binary
    model_path = "src/models/random_forest_sikkim.joblib"
    joblib.dump(model, model_path)
    print(f"\nTrained model saved to: {model_path}")

if __name__ == "__main__":
    train_model()
