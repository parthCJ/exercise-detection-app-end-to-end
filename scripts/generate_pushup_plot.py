import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
import numpy as np
import json
import sys
from datetime import datetime
import base64
import io

def generate_pushup_progress_plot(workout_data):
    """Generate a progress plot from workout data"""
    try:
        # Convert workout data to DataFrame
        df = pd.DataFrame(workout_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values(by='date')
        
        # Prepare data for ML model
        df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
        
        # Train Linear Regression model
        X = df[['days_since_start']]
        y = df['reps']
        
        model = LinearRegression()
        model.fit(X, y)
        y_pred = model.predict(X)
        
        # Create the plot
        plt.style.use('seaborn-v0_8-darkgrid')
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Plot actual data as scatter points
        ax.scatter(df['date'], df['reps'], color='mediumspringgreen', 
                  label='Actual Reps', s=100, alpha=0.8)
        
        # Plot ML prediction as trend line
        ax.plot(df['date'], y_pred, color='cyan', linestyle='--', 
               linewidth=3, label='ML Trend Line')
        
        # Format the plot
        ax.set_title("Push-up Progress and ML Trend 💪", fontsize=16, fontweight='bold')
        ax.set_xlabel("Date", fontsize=12)
        ax.set_ylabel("Number of Reps", fontsize=12)
        ax.tick_params(axis='x', labelrotation=45)
        ax.legend(fontsize=10)
        ax.grid(True, alpha=0.3)
        
        # Add statistics text
        total_reps = df['reps'].sum()
        avg_reps = df['reps'].mean()
        best_session = df['reps'].max()
        
        stats_text = f"Total Reps: {total_reps}\nAvg per Session: {avg_reps:.1f}\nBest Session: {best_session}"
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, 
               verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        
        plt.tight_layout()
        
        # Convert plot to base64 string
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        plot_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return {
            "success": True,
            "plot_data": plot_base64,
            "statistics": {
                "total_reps": int(total_reps),
                "average_reps": round(avg_reps, 1),
                "best_session": int(best_session),
                "total_sessions": len(df),
                "trend_slope": float(model.coef_[0])
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "plot_data": None,
            "statistics": None
        }

if __name__ == "__main__":
    try:
        # Read workout data from stdin or command line
        if len(sys.argv) > 1:
            workout_data_json = sys.argv[1]
        else:
            workout_data_json = sys.stdin.read()
        
        workout_data = json.loads(workout_data_json)
        result = generate_pushup_progress_plot(workout_data)
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "plot_data": None,
            "statistics": None
        }
        print(json.dumps(error_result))
