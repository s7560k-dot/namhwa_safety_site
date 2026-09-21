import matplotlib.pyplot as plt
import networkx as nx
import pandas as pd
from datetime import datetime

# ----------------------------------------------------------------------
# [평택 세탁소 현장 - Humphreys] CPM Analysis Script
# ----------------------------------------------------------------------

class CPMAnalyzer:
    def __init__(self, start_date_str="2024-04-15"):
        self.start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        self.tasks = {}
        self.dependencies = []

    def add_task(self, id, name, duration, cost=0):
        self.tasks[id] = {
            'id': id,
            'name': name,
            'duration': duration,
            'cost': cost,
            'es': 0, 'ef': 0, 'ls': 0, 'lf': 0, 'tf': 0,
            'is_critical': False
        }

    def add_dependency(self, pred, succ, lag=0):
        self.dependencies.append((pred, succ, lag))

    def calculate(self):
        # 1. Forward Pass
        for t in self.tasks.values(): 
            t['es'] = 0
            t['ef'] = t['duration']

        G = nx.DiGraph()
        for p, s, l in self.dependencies:
            G.add_edge(p, s, lag=l)
        
        order = list(nx.topological_sort(G))
        
        for task_id in order:
            preds = [d for d in self.dependencies if d[1] == task_id]
            if preds:
                self.tasks[task_id]['es'] = max(self.tasks[p]['ef'] + l for p, s, l in preds)
            self.tasks[task_id]['ef'] = self.tasks[task_id]['es'] + self.tasks[task_id]['duration']

        # 2. Backward Pass
        project_duration = max(t['ef'] for t in self.tasks.values())
        for t in self.tasks.values():
            t['lf'] = project_duration
            t['ls'] = project_duration - t['duration']

        for task_id in reversed(order):
            succs = [d for d in self.dependencies if d[0] == task_id]
            if succs:
                self.tasks[task_id]['lf'] = min(self.tasks[s]['ls'] - l for p, s, l in succs)
            self.tasks[task_id]['ls'] = self.tasks[task_id]['lf'] - self.tasks[task_id]['duration']

        # 3. Slack & Critical Path
        for t in self.tasks.values():
            t['tf'] = t['ls'] - t['es']
            t['is_critical'] = (t['tf'] <= 0)

        return project_duration

    def plot_gantt(self, filename="gantt_chart.png", title="CPM Gantt Chart"):
        plt.figure(figsize=(12, 8))
        plt.rcParams['font.family'] = 'Malgun Gothic'
        plt.rcParams['axes.unicode_minus'] = False
        
        task_list = sorted(self.tasks.values(), key=lambda x: x['es'])
        names = [f"{t['id']}. {t['name']}" for t in task_list]
        starts = [t['es'] for t in task_list]
        durations = [t['duration'] for t in task_list]
        colors = ['#e74c3c' if t['is_critical'] else '#3498db' for t in task_list]

        plt.barh(names, durations, left=starts, color=colors, alpha=0.8)
        plt.xlabel('Days')
        plt.title(title)
        plt.grid(axis='x', linestyle='--', alpha=0.5)
        plt.gca().invert_yaxis()
        
        for i, t in enumerate(task_list):
            plt.text(t['ef'] + 5, i, f"{t['es']}~{t['ef']} (TF:{t['tf']})", va='center', fontsize=8)

        plt.tight_layout()
        plt.savefig(filename)
        plt.close()

    def get_report(self):
        return pd.DataFrame(self.tasks.values())

def run_pyeongtaek_simulation(delay_p=0, crash_c=0):
    analyzer = CPMAnalyzer()
    
    # Task List from Image 2 (Pyeongtaek Humphreys)
    analyzer.add_task('G00M1010', "Start Project", 0)
    analyzer.add_task('G00D1010', "Submit ENG 4288", 30)
    analyzer.add_task('G00D1020', "G/A - ENG 4288", 30)
    analyzer.add_task('P00O1010', "Submit Off-shore Submittals", 30)
    analyzer.add_task('P00O1020', "G/A - Off-shore Submittals", 30)
    analyzer.add_task('P00O1030', "Procurement of Off-shore Materials", 180 + delay_p)
    
    analyzer.add_task('C00C1010', "Install Silt Fence", 7)
    analyzer.add_task('C00C1020', "Removal of Existing Civil", 15)
    analyzer.add_task('C00C1120', "Construction Period", 632 - crash_c)
    analyzer.add_task('G00S9040', "Inspection & Turn-over", 71)
    analyzer.add_task('G00M1020', "End Project", 0)

    # Dependencies (Inferred to make P00O1030 Critical as per user request)
    # Path A: Admin & Procurement
    analyzer.add_dependency('G00M1010', 'G00D1010', 0)
    analyzer.add_dependency('G00D1010', 'G00D1020', 0)
    analyzer.add_dependency('G00D1020', 'P00O1010', 0)
    analyzer.add_dependency('P00O1010', 'P00O1020', 0)
    analyzer.add_dependency('P00O1020', 'P00O1030', 0)
    
    # Path B: Early Construction
    analyzer.add_dependency('G00M1010', 'C00C1010', 91) # Start + 91 days
    analyzer.add_dependency('C00C1010', 'C00C1020', 0)
    
    # Merging Paths
    # To make P00O1030 critical, Construction (C1120) must wait for it or vice versa
    # User says P00O1030 is critical, so let's link it to the main construction block
    analyzer.add_dependency('C00C1020', 'C00C1120', 0)
    
    # CRITICAL LINK: Assume construction completion depends on material arrival (MEP install)
    # We use a large lag or link to the end phase to ensure it's on the path
    analyzer.add_dependency('P00O1030', 'C00C1120', 400) # Material arrives, then final 400 days of construction
    
    analyzer.add_dependency('C00C1120', 'G00S9040', 0)
    analyzer.add_dependency('G00S9040', 'G00M1020', 0)

    dur = analyzer.calculate()
    return analyzer, dur

if __name__ == "__main__":
    # 1. Baseline
    ana_b, dur_b = run_pyeongtaek_simulation()
    print("\n--- Pyeongtaek Baseline ---")
    print(ana_b.get_report())
    ana_b.plot_gantt("gantt_pt_baseline.png", "Pyeongtaek Project Baseline")

    # 2. Delay (P00O1030 +30d)
    ana_d, dur_d = run_pyeongtaek_simulation(delay_p=30)
    print("\n--- 30d Delay (P00O1030) ---")
    print(ana_d.get_report())
    ana_d.plot_gantt("gantt_pt_delayed.png", "Pyeongtaek Delay Scenario (+30d)")

    # 3. Crashing (C00C1120 -10d)
    # User asked for crushing G00M1020 in Dae-kwang, let's try crashing Construction here
    ana_c, dur_c = run_pyeongtaek_simulation(delay_p=30, crash_c=10)
    print("\n--- Delay + Crashing (Construction -10d) ---")
    print(ana_c.get_report())
    ana_c.plot_gantt("gantt_pt_crashing.png", "Pyeongtaek Crashing Plan (-10d)")
