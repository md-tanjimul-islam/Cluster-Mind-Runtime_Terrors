import numpy as np
from sklearn.ensemble import IsolationForest

class ClusterAnomalyEngine:
    """
    IsolationForest Anomaly Detection Model for ClusterMind
    Evaluates 6D Telemetry Vector: [CPU %, RAM %, Disk IOPS, Network Jitter, GPU Temp °C, GPU Util %]
    """
    def __init__(self):
        # Generate baseline training data (nominal cluster operational state)
        np.random.seed(42)
        nominal_data = np.random.normal(
            loc=[50.0, 55.0, 120.0, 4.0, 62.0, 65.0],
            scale=[10.0, 8.0, 20.0, 1.5, 6.0, 12.0],
            size=(500, 6)
        )
        # Clip to realistic physical bounds
        nominal_data = np.clip(nominal_data, 0, 100)

        # Initialize IsolationForest Classifier
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42
        )
        self.model.fit(nominal_data)

    def predict_risk(self, cpu: float, ram: float, disk_io: float, net_jitter: float, gpu_temp: float, gpu_util: float, risk_threshold: float = 65.0):
        """
        Runs IsolationForest inference on a 6D telemetry vector.
        Returns composite anomaly score, risk percentage (0-100), and status tier.
        """
        vector = np.array([[cpu, ram, disk_io, net_jitter, gpu_temp, gpu_util]])
        
        # decision_function: positive values = inliers (normal), negative values = outliers (anomalies)
        raw_score = float(self.model.decision_function(vector)[0])
        
        # Convert decision function score to 0–100% Risk Score
        # Normal score (~0.15 to 0.25) -> low risk (<25%)
        # Anomaly score (~-0.2 to -0.4) -> high risk (>70%)
        if raw_score >= 0.15:
            risk = int(np.clip(10 + (0.25 - raw_score) * 40, 5, 25))
        elif raw_score >= 0.0:
            risk = int(np.clip(25 + (0.15 - raw_score) * 160, 25, 50))
        elif raw_score >= -0.15:
            risk = int(np.clip(50 + (-raw_score) * 150, 50, 72))
        else:
            risk = int(np.clip(72 + (-0.15 - raw_score) * 120, 72, 98))

        # Explicit physical overload rules for severe CPU/GPU/Thermal stress
        cpu_stress = max(0.0, (cpu - 75.0) / 25.0) if cpu > 75.0 else 0.0
        temp_stress = max(0.0, (gpu_temp - 70.0) / 20.0) if gpu_temp > 70.0 else 0.0
        gpu_stress = max(0.0, (gpu_util - 75.0) / 25.0) if gpu_util > 75.0 else 0.0
        ram_stress = max(0.0, (ram - 80.0) / 20.0) if ram > 80.0 else 0.0

        physical_risk = int(min(98, 25 + (cpu_stress * 40 + temp_stress * 30 + gpu_stress * 20 + ram_stress * 10)))
        if cpu >= 90 or gpu_temp >= 75 or gpu_util >= 85:
            risk = max(risk, physical_risk, 75)

        if risk >= risk_threshold:
            status = 'critical'
        elif risk >= 30:
            status = 'watch'
        else:
            status = 'healthy'

        return {
            "anomaly_score": round(raw_score, 4),
            "risk": risk,
            "status": status
        }

# Global singleton model instance
anomaly_engine = ClusterAnomalyEngine()
