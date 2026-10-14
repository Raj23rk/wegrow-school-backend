export interface SubtopicGroup {
  category: string;
  items: string[];
}

export interface ModuleData {
  no: number;
  name: string;
  type: 'Code' | 'No-code' | 'Project';
  duration: string;
  hours: number;
  subtopics: SubtopicGroup[];
  miniProjects?: string[];
}

export interface PhaseData {
  id: string;
  phaseNumber: number;
  phaseTitle: string;
  subject: string;
  code: string;
  months: string;
  focus: string;
  hours: number;
  term: string;
  totalCredits: number;
  totalChapters: number;
  downloadRestricted: boolean;
  outcome: string;
  phaseProjects: string[];
  nextPhase?: string;
  modules: ModuleData[];
  units: {
    unitNumber: string;
    title: string;
    weightage: string;
    topics: string[];
  }[];
}

export const AI_COURSE_SYLLABUS: PhaseData[] = [
  {
    id: 'phase_1',
    phaseNumber: 1,
    phaseTitle: 'Phase 1: Foundation – Python & No-code AI Basics',
    subject: 'Foundation – Python, Teachable Machine & PictoBlox',
    code: 'PHASE-01',
    months: 'Months 1–2',
    focus: 'Python, Teachable Machine & PictoBlox',
    hours: 60,
    term: '12-Month AI Master Track',
    totalCredits: 10,
    totalChapters: 3,
    downloadRestricted: true,
    outcome:
      'Write Python programs and build AI models and AI-powered games using no-code tools like Teachable Machine and PictoBlox.',
    phaseProjects: [
      'Calculator Application',
      'Number Guessing Game',
      'Quiz Application',
      'Student Mark Calculator',
      'Fruit Classifier (Teachable Machine)',
      'Gesture / Sound Recognizer',
      'AI Quiz Game (PictoBlox)',
    ],
    nextPhase: 'Phase 2: Data – Analysis, SQL & Visualization',
    modules: [
      {
        no: 1,
        name: 'Python Programming',
        type: 'Code',
        duration: '1 Month | Weeks 1–4',
        hours: 30,
        subtopics: [
          {
            category: 'Introduction to Python',
            items: [
              'Introduction to Programming',
              'What is Python?',
              'Features and Applications of Python',
              'Python Installation',
              'VS Code / Jupyter Notebook / Google Colab',
              'Python Program Structure',
              'Python Syntax and Indentation',
            ],
          },
          {
            category: 'Python Fundamentals',
            items: [
              'Variables & Data Types',
              'Input and Output',
              'Type Casting & Type Hinting',
              'Operators & Expressions',
              'Comments and Documentation',
            ],
          },
          {
            category: 'Conditional Statements & Loops',
            items: [
              'if, if-else, elif statements',
              'Nested Conditions',
              'for Loop and while Loop',
              'Nested Loops',
              'break, continue, pass control statements',
            ],
          },
          {
            category: 'Python Data Structures',
            items: [
              'Strings and Built-in String Methods',
              'Lists & List Operations',
              'Tuples & Immutability',
              'Sets & Venn Set Operations',
              'Dictionaries & Key-Value Maps',
              'List Comprehension – Introduction',
            ],
          },
          {
            category: 'Functions & Modules',
            items: [
              'Functions, Parameters and Arguments',
              'Return Values and Variable Scope',
              'Lambda Functions – Introduction',
              'Custom Modules Creation',
              'Packages & __init__.py',
              'pip and Installing Libraries',
            ],
          },
          {
            category: 'File Handling & Error Handling',
            items: [
              'File Handling (Read, Write, Append)',
              'Working with CSV and JSON Files',
              'Exception Handling (try-except-finally)',
              'Common Python Errors & Debugging',
            ],
          },
          {
            category: 'Object-Oriented Programming (OOP)',
            items: [
              'Classes and Objects',
              'Attributes and Methods',
              'Constructor (__init__)',
              'Inheritance – Basic Concept',
            ],
          },
          {
            category: 'Problem Solving Practice',
            items: [
              'Pattern Printing Logic',
              'Number and String Problems',
              'Basic Algorithm Logic Building',
              'Debugging Techniques in VS Code',
            ],
          },
        ],
        miniProjects: [
          'Calculator Application',
          'Number Guessing Game',
          'Interactive Quiz Application',
          'Student Mark Calculator',
        ],
      },
      {
        no: 2,
        name: 'Teachable Machine',
        type: 'No-code',
        duration: '0.5 Month | Weeks 5–6',
        hours: 15,
        subtopics: [
          {
            category: 'Introduction to No-code AI',
            items: [
              'What is Artificial Intelligence?',
              'How Machines Learn from Examples',
              'Classes, Samples and Training Concepts',
              'What is Google Teachable Machine?',
              'Interface and Workspace Overview',
            ],
          },
          {
            category: 'Image Project Lab',
            items: [
              'Creating Image Classes',
              'Collecting Samples using Webcam',
              'Uploading External Images & Augmentation',
              'Training the Computer Vision Model',
              'Testing with Live Webcam Preview',
            ],
          },
          {
            category: 'Audio Project Lab',
            items: [
              'Recording Sound Samples',
              'Background Noise Class Setup',
              'Training and Testing an Audio Classification Model',
            ],
          },
          {
            category: 'Pose Project Lab',
            items: [
              'Body Pose Samples Collection',
              'Training a Pose Model with Skeletal Tracking',
              'Testing Real-Time Pose Detection',
            ],
          },
          {
            category: 'Model Accuracy & Exporting',
            items: [
              'Balanced Datasets & Varied Samples',
              'Advanced Settings – Epochs, Batch Size, Learning Rate',
              'Understanding Accuracy and Loss Curves',
              'Exporting to TensorFlow.js Model',
              'Deploying Model in a Web Page & Sharing Project Link',
            ],
          },
        ],
        miniProjects: [
          'Fruit Classifier (Apple vs Banana vs Orange)',
          'Hand Gesture Detector',
          'Sound Command Voice Recognizer',
          'Yoga Pose Posture Checker',
        ],
      },
      {
        no: 3,
        name: 'PictoBlox: AI + Block Coding',
        type: 'No-code',
        duration: '0.5 Month | Weeks 7–8',
        hours: 15,
        subtopics: [
          {
            category: 'Introduction to PictoBlox',
            items: [
              'What is Block Coding?',
              'PictoBlox Interface, Canvas & Sprites',
              'Stage, Sprites, Backdrops & Costumes',
              'Blocks and Scripts Architecture',
            ],
          },
          {
            category: 'Programming Logic using Blocks',
            items: [
              'Events and Triggers',
              'Motion and Looks Blocks',
              'Loops and Conditions',
              'Variables and Lists',
              'Custom Blocks Creation',
            ],
          },
          {
            category: 'AI Extensions in Action',
            items: [
              'Face Detection & Expression Recognition',
              'Image Classification Extension',
              'Object Detection in Real-Time',
              'Speech Recognition & Natural Speech Input',
              'Text to Speech Synthesis',
              'Text Recognition (OCR) Scanner',
            ],
          },
          {
            category: 'Machine Learning Environment',
            items: [
              'Creating Custom Image Classifier',
              'Creating Custom Pose Classifier',
              'Creating Custom Audio Classifier',
              'Testing and Using Trained Models in Sprites',
            ],
          },
          {
            category: 'Block Coding to Python Bridge',
            items: [
              'Python Coding Mode in PictoBlox',
              'Converting Visual Blocks to Python Code',
              'Running AI Scripts natively in Python',
            ],
          },
        ],
        miniProjects: [
          'AI Quiz Game with Voice Response',
          'Face-Tracking Interactive Sprite',
          'Voice-Controlled Virtual Assistant',
          'Gesture-Controlled Space Game',
        ],
      },
    ],
    units: [
      {
        unitNumber: 'Module 1',
        title: 'Python Programming (Code - 30 Hours)',
        weightage: '30 Hours',
        topics: [
          'Introduction to Python & VS Code / Colab',
          'Variables, Data Types & Operators',
          'Conditionals & Loops',
          'Data Structures (Lists, Tuples, Sets, Dicts)',
          'Functions, Modules & Libraries',
          'File Handling & Exception Handling',
          'OOP: Classes & Methods',
          'Mini Projects: Calculator, Quiz App, Student Marks',
        ],
      },
      {
        unitNumber: 'Module 2',
        title: 'Teachable Machine (No-code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'AI Fundamentals & Data Labeling',
          'Image Classification via Webcam',
          'Audio & Noise Classification',
          'Pose Detection & Tracking',
          'Model Accuracy, Epochs & Learning Rates',
          'Exporting to TensorFlow.js & Web Embedding',
        ],
      },
      {
        unitNumber: 'Module 3',
        title: 'PictoBlox: AI + Block Coding (No-code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'Visual Block Logic & Sprite Canvas',
          'Face Detection, OCR & Speech Recognition',
          'Custom Machine Learning Classifiers',
          'Block to Python Code Bridge',
          'Interactive AI Games & Assistant Projects',
        ],
      },
    ],
  },
  {
    id: 'phase_2',
    phaseNumber: 2,
    phaseTitle: 'Phase 2: Data – Analysis, SQL & Visualization',
    subject: 'Data – NumPy, Pandas, SQL, Matplotlib, Seaborn & Power BI',
    code: 'PHASE-02',
    months: 'Months 3–4',
    focus: 'NumPy, Pandas, SQL, Matplotlib, Seaborn & Power BI',
    hours: 60,
    term: '12-Month AI Master Track',
    totalCredits: 10,
    totalChapters: 3,
    downloadRestricted: true,
    outcome:
      'Analyze data using Python and SQL, create insightful charts and build interactive Power BI dashboards.',
    phaseProjects: [
      'Student Database Analysis',
      'Sales Data Analysis',
      'Employee Data Analysis using Python + SQL',
      'EDA on a Real-World Dataset',
      'Sales / Student Performance Power BI Dashboard',
    ],
    nextPhase: 'Phase 3: Machine Learning – Models & Pipelines',
    modules: [
      {
        no: 4,
        name: 'NumPy, Pandas & Basic SQL',
        type: 'Code',
        duration: '1 Month | Weeks 9–12',
        hours: 30,
        subtopics: [
          {
            category: 'NumPy Arrays & Math',
            items: [
              'Introduction to NumPy & Vectorization',
              'NumPy Arrays: 1D and 2D Arrays',
              'Array Indexing, Slicing & Boolean Masks',
              'Array Operations & Broadcasting',
              'Shape and Reshape, Flattening',
              'Mathematical & Statistical Functions',
              'NumPy Random Module & Distributions',
            ],
          },
          {
            category: 'Pandas DataFrames',
            items: [
              'Introduction to Pandas: Series vs DataFrame',
              'Creating DataFrames from Dictionaries & Lists',
              'Reading CSV and Excel Files',
              'Selecting, Filtering & Querying Data',
              'Sorting Data & Ranking',
              'Handling Missing Values (NaN, fillna, dropna)',
              'Removing Duplicates & Outliers',
              'Grouping and Aggregation (groupby, agg)',
              'Merging, Joining and Concatenating DataFrames',
              'Data Cleaning Pipelines',
            ],
          },
          {
            category: 'SQL Fundamentals',
            items: [
              'Introduction to Relational Databases',
              'Database and Table Concepts, Schemas',
              'Primary Key & Foreign Key',
              'Creating Tables & Constraints',
              'Inserting Data (INSERT INTO)',
              'SELECT Statement & Filtering (WHERE Clause)',
              'ORDER BY, GROUP BY & HAVING Clause',
              'Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)',
              'UPDATE and DELETE Statements',
            ],
          },
          {
            category: 'SQL Queries & Python Integration',
            items: [
              'SQL Joins: INNER JOIN, LEFT JOIN, RIGHT JOIN',
              'Subqueries & Nested SELECT Statements',
              'Basic Data Analysis using SQL',
              'Connecting Python with SQL Databases (SQLite & SQLAlchemy)',
            ],
          },
        ],
        miniProjects: [
          'Student Academic Database Analysis',
          'E-Commerce Sales Data Analysis',
          'Employee Salary & Department Analysis (Python + SQL)',
        ],
      },
      {
        no: 5,
        name: 'Matplotlib & Seaborn',
        type: 'Code',
        duration: '0.5 Month | Weeks 13–14',
        hours: 15,
        subtopics: [
          {
            category: 'Introduction to Data Visualization',
            items: [
              'Importance of Data Visualization in AI',
              'Choosing the Right Chart for the Right Metric',
              'Visualization Workflow & Color Palettes',
            ],
          },
          {
            category: 'Matplotlib Essentials',
            items: [
              'Line Chart & Trendlines',
              'Bar Chart & Horizontal Bar Charts',
              'Pie Chart & Donut Visuals',
              'Histogram & Frequency Distributions',
              'Scatter Plot & Correlation Plots',
              'Subplots Grid & Multi-axis Figures',
              'Chart Customization (Labels, Legends, Titles)',
              'Saving High-Resolution Charts (PNG, PDF)',
            ],
          },
          {
            category: 'Seaborn Statistical Plots',
            items: [
              'Introduction to Seaborn Theme Engine',
              'Count Plot & Categorical Distribution',
              'Distribution Plot (histplot & kdeplot)',
              'Box Plot & Quartile Outlier Detection',
              'Violin Plot for Kernel Density',
              'Pair Plot for Multi-variable Correlation',
              'Heatmap with Annotations',
              'Correlation Matrix Visualization',
            ],
          },
          {
            category: 'Exploratory Data Analysis (EDA)',
            items: [
              'Understanding Dataset Shapes & Types',
              'Finding Patterns and Outliers in Real Data',
              'Univariate and Bivariate Analysis',
              'Insights, Storytelling and Executive Reporting with Data',
            ],
          },
        ],
        miniProjects: [
          'Student Performance & Grade Visualization',
          'Retail Sales Trends Visualization',
          'Complete EDA on a Real-World Kaggle Dataset',
        ],
      },
      {
        no: 6,
        name: 'Power BI',
        type: 'No-code',
        duration: '0.5 Month | Weeks 15–16',
        hours: 15,
        subtopics: [
          {
            category: 'Power BI Fundamentals',
            items: [
              'Introduction to Business Intelligence',
              'Power BI Architecture Overview',
              'Power BI Desktop Setup & Interface Walkthrough',
              'Importing Data from Excel, CSV & Web',
            ],
          },
          {
            category: 'Data Preparation (Power Query)',
            items: [
              'Data Cleaning using Power Query Editor',
              'Data Transformation & Column Splitting',
              'Handling Types, Errors & Pivoting',
            ],
          },
          {
            category: 'Power BI Data Modeling & DAX',
            items: [
              'Table Relationships & Star Schema Modeling',
              'Calculated Columns vs Measures',
              'Basic DAX Functions (SUM, AVERAGE, CALCULATE, RELATED)',
              'Aggregations and Filter Context',
            ],
          },
          {
            category: 'Interactive Dashboard Development',
            items: [
              'Charts, Cards and KPI Indicators',
              'Tables & Matrix Visuals',
              'Filters, Slicers & Timeline Selectors',
              'Interactive Cross-Filtering Reports',
              'Professional Dashboard Layout & Dark Theme Design',
              'Publishing & Sharing via Power BI Service',
            ],
          },
        ],
        miniProjects: ['Interactive Sales / Student Performance Power BI Dashboard'],
      },
    ],
    units: [
      {
        unitNumber: 'Module 4',
        title: 'NumPy, Pandas & Basic SQL (Code - 30 Hours)',
        weightage: '30 Hours',
        topics: [
          'NumPy Arrays, Slicing & Vectorized Operations',
          'Pandas DataFrames, Cleaning & Missing Data Handling',
          'SQL DDL & DML: Tables, SELECT, WHERE, GROUP BY',
          'SQL Joins & Connecting Python with SQLite',
        ],
      },
      {
        unitNumber: 'Module 5',
        title: 'Matplotlib & Seaborn (Code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'Matplotlib: Line, Bar, Scatter & Subplots',
          'Seaborn: Boxplots, Heatmaps & Correlation Matrices',
          'Exploratory Data Analysis (EDA) Best Practices',
        ],
      },
      {
        unitNumber: 'Module 6',
        title: 'Power BI (No-code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'Power Query Data Transformations',
          'Data Modeling & DAX Expressions',
          'Interactive Executive Dashboards & KPI Cards',
          'Publishing & Cloud Sharing',
        ],
      },
    ],
  },
  {
    id: 'phase_3',
    phaseNumber: 3,
    phaseTitle: 'Phase 3: Machine Learning – Models & Pipelines',
    subject: 'Machine Learning – ML Fundamentals, Lobe & Advanced ML',
    code: 'PHASE-03',
    months: 'Months 5–6',
    focus: 'ML Fundamentals, Lobe & Advanced ML',
    hours: 60,
    term: '12-Month AI Master Track',
    totalCredits: 10,
    totalChapters: 3,
    downloadRestricted: true,
    outcome:
      'Train, evaluate and optimize ML models, build no-code image classifiers and create end-to-end ML pipelines.',
    phaseProjects: [
      'House Price Prediction',
      'Student Result Prediction',
      'Customer Classification',
      'Flower Classification',
      'Waste Segregation Classifier (Lobe)',
      'End-to-End Machine Learning Prediction System',
    ],
    nextPhase: 'Phase 4: Computer Vision – Deep Learning, OpenCV & Object Detection',
    modules: [
      {
        no: 7,
        name: 'ML Fundamentals',
        type: 'Code',
        duration: '0.75 Month | Weeks 17–19',
        hours: 20,
        subtopics: [
          {
            category: 'Introduction to Machine Learning',
            items: [
              'Introduction to Artificial Intelligence & Machine Learning',
              'AI vs Machine Learning vs Deep Learning',
              'Real-world Machine Learning Applications',
              'Types of Machine Learning: Supervised vs Unsupervised vs Reinforcement',
            ],
          },
          {
            category: 'Machine Learning Workflow',
            items: [
              'Dataset Structure: Features and Labels (X & y)',
              'Training Data vs Testing Data Split (train_test_split)',
              'Model Training (fit) and Model Prediction (predict)',
            ],
          },
          {
            category: 'Scikit-learn Algorithms',
            items: [
              'Introduction to Scikit-learn Library',
              'Linear Regression (Ordinary Least Squares)',
              'Logistic Regression for Binary Classification',
              'K-Nearest Neighbors (KNN)',
              'Decision Tree Classifier & Regressor',
              'Random Forest Ensemble Learning',
              'K-Means Clustering for Unsupervised Learning',
            ],
          },
          {
            category: 'Model Evaluation Metrics',
            items: [
              'Accuracy, Precision, Recall, F1 Score',
              'Confusion Matrix & Heatmap Display',
              'Mean Squared Error (MSE), Root MSE',
              'R² Score (Coefficient of Determination)',
            ],
          },
        ],
        miniProjects: [
          'House Price Prediction System',
          'Student Examination Result Prediction',
          'Customer Churn / Segmentation Classification',
          'Iris Flower Species Classifier',
        ],
      },
      {
        no: 8,
        name: 'Lobe Visual ML Lab',
        type: 'No-code',
        duration: '0.5 Month | Weeks 20–21',
        hours: 15,
        subtopics: [
          {
            category: 'Introduction to Visual ML',
            items: [
              'No-code ML vs Code-based ML Frameworks',
              'What is Microsoft Lobe?',
              'Lobe Interface and Visual Studio Overview',
              'Image Classification Concepts in Visual AI',
            ],
          },
          {
            category: 'Building an Image Classifier',
            items: [
              'Creating Labels and Label Hierarchies',
              'Importing and Labelling Custom Images',
              'Using Webcam Images for Instant Capture',
              'Automatic Background Training Pipeline',
              'Reviewing Training Results in Real Time',
            ],
          },
          {
            category: 'Understanding & Improving Results',
            items: [
              'Model Accuracy and Confidence Scores',
              'Finding Wrong Predictions and Outliers',
              'Adding Varied Images and Edge Cases',
              'Balancing Labels to Prevent Model Bias',
              'Retraining the Model with Visual Feedback',
            ],
          },
          {
            category: 'Testing & Exporting Models',
            items: [
              'Live Playground Testing with Camera',
              'Exporting the Trained Model (TensorFlow, ONNX, CoreML)',
              'Using an Exported Model in Python Script',
            ],
          },
        ],
        miniProjects: [
          'Waste Segregation Classifier (Organic vs Recyclable)',
          'Plant Leaf Disease Classifier',
          'Custom Industrial Object Sorter',
          'Dog vs Cat Image Classifier',
        ],
      },
      {
        no: 9,
        name: 'Advanced ML & Pipeline',
        type: 'Code',
        duration: '0.75 Month | Weeks 22–24',
        hours: 25,
        subtopics: [
          {
            category: 'Data Preprocessing',
            items: [
              'Data Cleaning at Scale',
              'Handling Missing Values (SimpleImputer, KNNImputer)',
              'Handling Duplicate Data and Cardinality',
              'Encoding Categorical Data (One-Hot, Ordinal Encoding)',
              'Feature Scaling (MinMaxScaler)',
              'Normalization and Standardization (StandardScaler)',
            ],
          },
          {
            category: 'Feature Engineering & Selection',
            items: [
              'Feature Selection Techniques',
              'Feature Creation and Interaction Terms',
              'Feature Transformation (Log, Power Transforms)',
              'Feature Importance via Tree Ensembles',
            ],
          },
          {
            category: 'Advanced Algorithms',
            items: [
              'Support Vector Machine (SVM) – Kernels & Hyperplanes',
              'Naive Bayes Classifier',
              'Gradient Boosting (GBM) – Introduction',
              'XGBoost Classifier and Regressor',
              'Principal Component Analysis (PCA) – Dimensionality Reduction',
            ],
          },
          {
            category: 'Model Optimization & Pipelines',
            items: [
              'Overfitting vs Underfitting Analysis (Bias-Variance Tradeoff)',
              'K-Fold Cross Validation (cross_val_score)',
              'Hyperparameter Tuning: Grid Search (GridSearchCV) & Random Search',
              'Model Comparison and Leaderboard Benchmarks',
              'Scikit-learn Pipeline (Pipeline & ColumnTransformer)',
              'Preprocessing Pipeline, Training Pipeline, Prediction Pipeline',
              'Saving & Loading ML Models (Pickle, Joblib)',
            ],
          },
        ],
        miniProjects: ['End-to-End Machine Learning Production Prediction System'],
      },
    ],
    units: [
      {
        unitNumber: 'Module 7',
        title: 'ML Fundamentals (Code - 20 Hours)',
        weightage: '20 Hours',
        topics: [
          'AI/ML Foundations & Workflow Architecture',
          'Linear & Logistic Regression, Decision Trees, Random Forests',
          'Evaluation: Precision, Recall, F1 Score & Confusion Matrix',
          'Regression Metrics: MSE, RMSE, R² Score',
        ],
      },
      {
        unitNumber: 'Module 8',
        title: 'Lobe Visual ML Lab (No-code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'Visual Dataset Collection & Labeling in Microsoft Lobe',
          'Automatic Model Training & Confidence Auditing',
          'Exporting to TensorFlow & Python Runtime',
        ],
      },
      {
        unitNumber: 'Module 9',
        title: 'Advanced ML & Pipeline (Code - 25 Hours)',
        weightage: '25 Hours',
        topics: [
          'Advanced Preprocessing: Scalers, Imputers & Encoders',
          'SVM, XGBoost & PCA Dimensionality Reduction',
          'Hyperparameter Tuning via GridSearchCV',
          'End-to-End Production Pipelines with Joblib Serialization',
        ],
      },
    ],
  },
  {
    id: 'phase_4',
    phaseNumber: 4,
    phaseTitle: 'Phase 4: Computer Vision – Deep Learning, OpenCV & Object Detection',
    subject: 'Computer Vision – Deep Learning, OpenCV, YOLO & Roboflow',
    code: 'PHASE-04',
    months: 'Months 7–8',
    focus: 'Deep Learning, OpenCV, YOLO & Roboflow',
    hours: 45,
    term: '12-Month AI Master Track',
    totalCredits: 8,
    totalChapters: 3,
    downloadRestricted: true,
    outcome:
      'Build deep learning models, camera-based object detection apps and custom detection datasets.',
    phaseProjects: [
      'AI Image Classification System',
      'Face Detection System',
      'Smart Camera',
      'YOLO Object Detection System',
      'AI Eyes – Vision Assistant',
      'Custom Object Detection Model (Roboflow)',
    ],
    nextPhase: 'Phase 5: Language & Generative AI – NLP, LLMs & Automation',
    modules: [
      {
        no: 10,
        name: 'Deep Learning & TensorFlow',
        type: 'Code',
        duration: '0.75 Month | Weeks 25–27',
        hours: 20,
        subtopics: [
          {
            category: 'Introduction to Deep Learning',
            items: [
              'Machine Learning vs Deep Learning Differences',
              'Biological vs Artificial Neural Networks (ANN)',
              'Artificial Neuron Structure (Perceptron)',
              'Input Layer, Hidden Layers, Output Layer',
            ],
          },
          {
            category: 'Neural Network Concepts',
            items: [
              'Activation Functions (ReLU, Sigmoid, Softmax, Tanh)',
              'Loss Functions (Cross-Entropy, Mean Squared Error)',
              'Optimizers (SGD, Adam, RMSprop)',
              'Epochs, Batch Size & Iterations',
              'Forward Propagation Pipeline',
              'Backpropagation & Gradient Descent – Conceptual & Practical',
            ],
          },
          {
            category: 'TensorFlow & Keras API',
            items: [
              'Introduction to TensorFlow 2.x and tf.keras',
              'Sequential Model Architecture',
              'Dense Layers and Dropout Regularization',
              'Building Multi-Layer Neural Networks',
              'Model Training, Validation Split & Early Stopping',
              'Model Evaluation and Loss Curves',
              'Saving (.h5 / SavedModel) and Loading Weights',
            ],
          },
          {
            category: 'Convolutional Neural Networks (CNN)',
            items: [
              'Introduction to CNNs for Visual Data',
              'Convolution Operation and Filters / Kernels',
              'Feature Maps and Receptive Fields',
              'Pooling Layers (MaxPooling, AveragePooling)',
              'CNN Architecture (Conv2D -> Pool -> Flatten -> Dense)',
              'Image Classification with CNNs',
            ],
          },
          {
            category: 'Transfer Learning',
            items: [
              'Pre-trained Deep Learning Models (ImageNet)',
              'Feature Extraction vs Fine-Tuning',
              'MobileNet Architecture for Edge Devices',
              'ResNet Deep Residual Learning – Introduction',
            ],
          },
        ],
        miniProjects: ['AI Image Classification System (Deep CNN)'],
      },
      {
        no: 11,
        name: 'OpenCV & YOLO',
        type: 'Code',
        duration: '0.75 Month | Weeks 28–30',
        hours: 15,
        subtopics: [
          {
            category: 'Introduction to Computer Vision',
            items: [
              'What is Computer Vision and Real-World Use Cases',
              'Applications of Computer Vision in Autonomous Tech',
              'Images as Tensors, Pixels and Color Spaces (RGB vs BGR)',
            ],
          },
          {
            category: 'OpenCV Image Processing',
            items: [
              'Reading, Displaying and Writing Images (cv2.imread, cv2.imshow)',
              'Resizing, Cropping and Image Transformations',
              'Grayscale Conversion and Thresholding',
              'Image Processing: Blur, Gaussian Blur, Filtering',
              'Edge Detection with Canny Edge Detector',
              'Live Webcam Video Stream Programming (cv2.VideoCapture)',
            ],
          },
          {
            category: 'Face AI & Biometrics',
            items: [
              'Face Detection using Haar Cascades & MediaPipe',
              'Face Recognition – Basic Conceptual Architecture',
              'Real-Time Face Detection from Live Camera',
            ],
          },
          {
            category: 'Object Detection & YOLO Architecture',
            items: [
              'Object Detection Concepts vs Image Classification',
              'Bounding Boxes, Anchor Boxes, Coordinates (x, y, w, h)',
              'Class Probabilities & Confidence Scores',
              'Intersection over Union (IoU) & Non-Max Suppression (NMS)',
              'Introduction to YOLO (You Only Look Once)',
              'YOLO Real-Time Object Detection on Video',
              'Custom Dataset Structure & Basic Model Training',
              'Analyzing Detection Results and Inference Speeds',
            ],
          },
        ],
        miniProjects: [
          'Face Detection Attendance System',
          'Smart Security Camera with Motion Detection',
          'YOLO Real-Time Object Detection System',
          'AI Eyes – Vision Assistant for Visually Impaired',
        ],
      },
      {
        no: 12,
        name: 'Roboflow',
        type: 'No-code',
        duration: '0.5 Month | Weeks 31–32',
        hours: 10,
        subtopics: [
          {
            category: 'Introduction to Roboflow',
            items: [
              'Computer Vision Dataset Workflow Pipeline',
              'Roboflow Workspace and Collaborative Projects',
              'Project Types: Object Detection, Classification & Segmentation',
            ],
          },
          {
            category: 'Data Collection & Annotation',
            items: [
              'Uploading Raw Images and Videos',
              'Bounding Box Annotation Studio',
              'Class Labels and Multi-label Tagging',
              'Annotation Quality Checks and Review Tools',
            ],
          },
          {
            category: 'Dataset Preparation & Augmentation',
            items: [
              'Train / Validation / Test Automatic Split (70/20/10)',
              'Preprocessing: Auto-orient, Resize, Grayscale',
              'Data Augmentation: Flips, Rotations, Shear, Brightness, Blur',
              'Generating Versioned Datasets for Training',
            ],
          },
          {
            category: 'Training, Evaluation & Export',
            items: [
              'Training a Model Directly in Roboflow Train',
              'Model Metrics: mAP, Precision, Recall Concepts',
              'Testing Predictions in Web Interface',
              'Exporting Datasets in YOLO (v8/v11), COCO, Pascal VOC Formats',
              'Using Roboflow Inference Models via Python API',
              'Training YOLO with a Roboflow Dataset – End-to-End Overview',
            ],
          },
        ],
        miniProjects: [
          'Custom Object Detection Model (Safety Helmet / Fruit Freshness / Vehicle Detection)',
        ],
      },
    ],
    units: [
      {
        unitNumber: 'Module 10',
        title: 'Deep Learning & TensorFlow (Code - 20 Hours)',
        weightage: '20 Hours',
        topics: [
          'Neural Networks, Perceptrons, Activation Functions & Optimizers',
          'Building ANNs and CNNs with TensorFlow Keras',
          'Transfer Learning with MobileNet & ResNet',
          'Model Training, Loss Curves & Production Export',
        ],
      },
      {
        unitNumber: 'Module 11',
        title: 'OpenCV & YOLO (Code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'OpenCV Image Filters, Edge Detection & Live Webcam Feeds',
          'Real-Time Face Detection & Recognition',
          'YOLO Object Detection Pipeline & Bounding Box Inference',
          'Live Video Stream Processing',
        ],
      },
      {
        unitNumber: 'Module 12',
        title: 'Roboflow (No-code - 10 Hours)',
        weightage: '10 Hours',
        topics: [
          'Cloud CV Annotation & Data Labeling',
          'Dataset Augmentation & Train/Val/Test Splits',
          'Roboflow Train & mAP Performance Audits',
          'Exporting in YOLOv8 Format & REST API Integration',
        ],
      },
    ],
  },
  {
    id: 'phase_5',
    phaseNumber: 5,
    phaseTitle: 'Phase 5: Language & Generative AI – NLP, LLMs & Automation',
    subject: 'Language & Generative AI – NLP, Generative AI, LLM Apps & n8n Automation',
    code: 'PHASE-05',
    months: 'Months 9–10',
    focus: 'NLP, Generative AI, LLM Apps & n8n Automation',
    hours: 60,
    term: '12-Month AI Master Track',
    totalCredits: 10,
    totalChapters: 4,
    downloadRestricted: true,
    outcome:
      'Build NLP and text AI apps, write effective prompts, create LLM-powered applications and automate work using n8n AI workflows.',
    phaseProjects: [
      'Sentiment Analysis System',
      'AI Text Summarizer',
      'AI Study Assistant',
      'AI Quiz Generator',
      'AI Chatbot using LLM API',
      'n8n AI Email Auto-Reply Assistant',
    ],
    nextPhase: 'Phase 6: AI Builder – RAG, AI Agents, Vibe Coding & Final Capstone',
    modules: [
      {
        no: 13,
        name: 'NLP, Transformers & Hugging Face',
        type: 'Code',
        duration: '0.5 Month | Weeks 33–34',
        hours: 15,
        subtopics: [
          {
            category: 'Natural Language Processing (NLP)',
            items: [
              'Introduction to NLP and Language Understanding',
              'Real-world NLP Applications in Modern Tech',
              'Text Preprocessing: Tokenization & Word Segmentation',
              'Stop Words Removal & Punctuation Cleaning',
              'Stemming vs Lemmatization (NLTK / spaCy)',
            ],
          },
          {
            category: 'Text Representation & Embeddings',
            items: [
              'Bag of Words (BoW) Model',
              'TF-IDF (Term Frequency - Inverse Document Frequency)',
              'Text Classification Pipelines',
              'Sentiment Analysis on Customer Reviews',
            ],
          },
          {
            category: 'Transformers Architecture',
            items: [
              'Introduction to Transformers (Vaswani et al.)',
              'Transformer Architecture: Self-Attention Mechanism',
              'Encoder and Decoder Stacks',
              'BERT (Bidirectional Encoder Representations from Transformers)',
              'GPT (Generative Pre-trained Transformer) Family',
            ],
          },
          {
            category: 'Hugging Face Ecosystem',
            items: [
              'Introduction to Hugging Face Model Hub',
              'Using Pre-trained Models via transformers Library',
              'Hugging Face Tokenizers (AutoTokenizer)',
              'Hugging Face Pipelines (pipeline API)',
              'Text Classification & Sentiment Analysis Pipeline',
              'Text Generation & Summarization Pipeline',
            ],
          },
        ],
        miniProjects: [
          'Social Media Sentiment Analysis System',
          'Document Text Classification System',
          'AI Text Summarizer with Hugging Face',
        ],
      },
      {
        no: 14,
        name: 'Generative AI & Prompt Engineering',
        type: 'No-code',
        duration: '0.5 Month | Weeks 35–36',
        hours: 15,
        subtopics: [
          {
            category: 'Generative AI Fundamentals',
            items: [
              'What is Generative AI?',
              'AI vs ML vs Deep Learning vs Generative AI Differences',
              'Generative AI Applications in Creative & Enterprise Fields',
              'Large Language Models (LLM) Capabilities & Architecture',
              'Tokens, Context Windows and Tokenizers',
              'AI Limitations, Biases & Hallucinations',
              'Responsible AI, Safety, Copyright and Ethics',
            ],
          },
          {
            category: 'Prompt Engineering Frameworks',
            items: [
              'Introduction to Prompt Engineering as a Career Skill',
              'Anatomy of a Perfect Prompt: Role, Context, Task, Constraints, Output Format, Examples',
            ],
          },
          {
            category: 'Advanced Prompting Techniques',
            items: [
              'Zero-Shot Prompting vs Few-Shot Prompting',
              'Role-Based / Persona-Based Prompting',
              'Structured Prompting (JSON/Markdown Outputs)',
              'Iterative Prompt Refinement',
              'Reusable Prompt Templates',
              'Chain-of-Thought (CoT) Reasoning & Step-by-Step Prompting',
            ],
          },
          {
            category: 'Generative AI Tools Mastery',
            items: [
              'ChatGPT & Advanced Data Analysis',
              'Google Gemini 2.0 & Multimodal Workflows',
              'Anthropic Claude 3.5 Sonnet for Technical Tasks',
              'AI Coding Tools (Cursor, v0, GitHub Copilot)',
              'AI Image Generation (Midjourney, DALL-E, Recraft)',
              'AI Presentation Tools (Gamma, Beautiful.ai)',
              'AI Research Tools (Perplexity AI, Consensus)',
            ],
          },
        ],
        miniProjects: [
          'Personal AI Study Assistant & Tutor',
          'Automated AI Quiz Generator for Exams',
          'ATS-Optimized AI Resume & Cover Letter Assistant',
          'SEO Content & Social Media Campaign Generator',
        ],
      },
      {
        no: 15,
        name: 'LLM App Development',
        type: 'Code',
        duration: '0.5 Month | Weeks 37–38',
        hours: 15,
        subtopics: [
          {
            category: 'Large Language Model Architecture',
            items: [
              'LLM Fundamentals for Developers',
              'Context Window Mechanics & Token Limits',
              'Token Calculation & Cost Optimization',
              'Model Hyperparameters: Temperature, Top-P, Frequency Penalty',
              'System Instructions vs User Instructions vs Assistant Roles',
            ],
          },
          {
            category: 'LLM REST APIs & SDKs',
            items: [
              'Introduction to LLM APIs (OpenAI, Anthropic, Gemini, Groq)',
              'API Keys Management and Security (.env)',
              'API Requests and Responses Lifecycle in Python',
              'Connecting Python with LLM APIs',
              'Enforcing Structured / JSON Schema Output',
              'Streaming Responses for Real-Time UX',
              'API Error Handling, Retries & Rate Limit Backoff',
            ],
          },
          {
            category: 'AI Application Engineering',
            items: [
              'Prompt Templates & Dynamic Variable Injection',
              'Conversation History & Session State Management',
              'Basic Short-term & Long-term Memory Architectures',
              'Context Window Management & Summarization',
              'Function Calling – Introduction & JSON Schema',
              'Tool Calling – Teaching LLMs to Use External Tools',
            ],
          },
          {
            category: 'Real-World AI Applications',
            items: [
              'Building a Conversational AI Chatbot',
              'Automated Professional Email Generator',
              'Intelligent AI Resume Analyzer',
              'Interactive AI Learning Assistant with Personalized Feedback',
            ],
          },
        ],
        miniProjects: ['AI Chatbot using LLM API with Streaming & Custom Persona'],
      },
      {
        no: 16,
        name: 'n8n AI Automation',
        type: 'No-code',
        duration: '0.5 Month | Weeks 39–40',
        hours: 15,
        subtopics: [
          {
            category: 'Introduction to Workflow Automation',
            items: [
              'What is Workflow Automation and Why It Matters',
              'Triggers and Actions Paradigm',
              'Real-World Business Automation Use Cases',
              'n8n Architecture: Cloud vs Self-Hosted Setup',
            ],
          },
          {
            category: 'n8n Basics & Canvas',
            items: [
              'Interface, Visual Canvas and Node Catalog',
              'Nodes and Connections Architecture',
              'Workflows, Executions and History Logs',
              'Credentials and Secure Key Storage',
              'Testing, Debugging and Activating Live Workflows',
            ],
          },
          {
            category: 'Core Logic Nodes',
            items: [
              'Webhook Trigger (Incoming Webhooks)',
              'Schedule Trigger (Cron Jobs)',
              'HTTP Request Node (Connecting Any REST API)',
              'IF and Switch Routing Nodes',
              'Edit Fields (Set) Node for Data Transformation',
              'Merge Node for Combining Streams',
              'Code Node (JavaScript/Python) – Introduction',
            ],
          },
          {
            category: 'Working with Data & Integrations',
            items: [
              'JSON Data Flow & Nested Objects in n8n',
              'n8n Expressions and Dynamic Values',
              'Data Mapping across Nodes',
              'Handling Multiple Items & Loops',
              'App Integrations: Gmail, Google Sheets, Google Drive, Telegram, Slack',
            ],
          },
          {
            category: 'AI in n8n (Advanced AI Workflows)',
            items: [
              'LLM Chat Model Nodes (OpenAI, Anthropic, Ollama)',
              'Basic LLM Chain Node',
              'AI Agent Node with Autonomous Reasoning',
              'Memory Nodes (Window Buffer Memory, Redis)',
              'Tools Node: Calculator, Web Browser, Custom APIs',
              'Automated Summarization and Classification Workflows',
              'Error Handling, Execution Logs and Fallback Nodes',
            ],
          },
        ],
        miniProjects: [
          'AI Email Auto-Reply Assistant for Customer Support',
          'AI Lead Qualification Workflow (Google Sheets + Gmail)',
          'Telegram AI Chatbot with Knowledge Base',
          'Daily Automated News Summary Delivered to Email',
        ],
      },
    ],
    units: [
      {
        unitNumber: 'Module 13',
        title: 'NLP, Transformers & Hugging Face (Code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'NLP Text Tokenization, Lemmatization & TF-IDF',
          'Transformers Self-Attention & BERT/GPT Arch',
          'Hugging Face Model Hub, AutoTokenizer & Pipelines',
          'Sentiment Analysis & Text Summarization',
        ],
      },
      {
        unitNumber: 'Module 14',
        title: 'Generative AI & Prompt Engineering (No-code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'GenAI Foundations, Tokens, Context & Responsible AI',
          'Few-Shot, Role-Based & Chain-of-Thought Prompting',
          'ChatGPT, Gemini, Claude, Cursor & Midjourney',
          'AI Study Tutors & Resume Assistant Projects',
        ],
      },
      {
        unitNumber: 'Module 15',
        title: 'LLM App Development (Code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'LLM API Integration (OpenAI, Gemini, Groq) in Python',
          'Structured JSON Extraction & Streaming Responses',
          'Context Windows, Session Memory & Function Calling',
          'Full-Featured Conversational Chatbot Project',
        ],
      },
      {
        unitNumber: 'Module 16',
        title: 'n8n AI Automation (No-code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'Visual Workflow Nodes, Webhooks & Cron Triggers',
          'Google Sheets, Gmail, Telegram & Slack Integrations',
          'AI Agent Nodes, LLM Chains & Tool Calling in n8n',
          'Automated Email & Customer Support Workflows',
        ],
      },
    ],
  },
  {
    id: 'phase_6',
    phaseNumber: 6,
    phaseTitle: 'Phase 6: AI Builder – RAG, AI Agents, Vibe Coding & Final Capstone',
    subject: 'AI Builder – RAG, AI Agents, Vibe Coding & Final Capstone',
    code: 'PHASE-06',
    months: 'Months 11–12',
    focus: 'RAG, AI Agents, Vibe Coding & Final Capstone',
    hours: 60,
    term: '12-Month AI Master Track',
    totalCredits: 12,
    totalChapters: 4,
    downloadRestricted: true,
    outcome:
      'Build RAG applications and AI agents, deploy AI projects, create websites with AI and deliver a complete capstone project.',
    phaseProjects: [
      'AI PDF Question Answering System',
      'AI Agent Application with Web Interface',
      'Portfolio / Landing Page Website (Vibe Coding)',
      'Production-Ready Final Capstone Project',
    ],
    nextPhase: 'Course Completed – Ready for High-Paying AI / Data Careers!',
    modules: [
      {
        no: 17,
        name: 'Embeddings, RAG & LangChain',
        type: 'Code',
        duration: '0.5 Month | Weeks 41–42',
        hours: 15,
        subtopics: [
          {
            category: 'Text Embeddings',
            items: [
              'Introduction to Vector Embeddings',
              'Converting Text to High-Dimensional Vectors',
              'Semantic Similarity vs Keyword Matching',
              'Cosine Similarity and Distance Metrics',
              'State-of-the-Art Embedding Models (OpenAI, HuggingFace, BGE)',
            ],
          },
          {
            category: 'Vector Databases',
            items: [
              'Why Traditional Databases Fail at Vector Search',
              'Introduction to Vector Databases and Indexes',
              'Vector Storage and Approximate Nearest Neighbors (ANN)',
              'FAISS (Facebook AI Similarity Search)',
              'ChromaDB for Lightweight Local Vector Storage',
              'Pinecone & Cloud Vector Databases Overview',
            ],
          },
          {
            category: 'Retrieval-Augmented Generation (RAG)',
            items: [
              'What is RAG? Why RAG Solves Hallucinations and Knowledge Cutoffs',
              'RAG System Architecture',
              'Document Loading (PDF, DOCX, TXT, Web Pages)',
              'Document Chunking Strategies (Fixed, Recursive, Semantic)',
              'Chunk Overlap and Token Limits',
              'Embedding and Indexing Chunks in Vector Stores',
              'Similarity Search Retrieval and Re-ranking',
              'Prompt Augmentation and Final LLM Answer Generation',
              'RAG Workflow: Document → Chunk → Embedding → Vector DB → Retrieval → LLM → Answer',
            ],
          },
          {
            category: 'LangChain Framework',
            items: [
              'Introduction to LangChain Framework',
              'LangChain Models (ChatOpenAI, ChatAnthropic)',
              'Prompt Templates and Chat Prompts',
              'Document Loaders (PyPDFLoader, WebBaseLoader)',
              'Text Splitters (RecursiveCharacterTextSplitter)',
              'Vector Stores & Retrievers in LangChain',
              'LangChain Chains (create_retrieval_chain, LCEL)',
              'Production RAG Applications with Citations',
            ],
          },
        ],
        miniProjects: ['AI PDF Document Question Answering System with Citations'],
      },
      {
        no: 18,
        name: 'AI Agents, LangGraph & Deployment',
        type: 'Code',
        duration: '0.5 Month | Weeks 43–44',
        hours: 15,
        subtopics: [
          {
            category: 'AI Agents Fundamentals',
            items: [
              'What is an Autonomous AI Agent?',
              'AI Assistant vs AI Agent: Key Architectural Differences',
              'Agent Workflow: Perception → Reasoning → Tool Execution → Reflection',
              'Tools and Tool Calling Architecture',
              'Agent Short-term and Persistent Memory',
              'Planning: ReAct Framework, Plan-and-Solve',
              'Executing Complex Multi-Step Tasks',
            ],
          },
          {
            category: 'LangGraph Framework',
            items: [
              'Introduction to LangGraph for Multi-Agent Systems',
              'Graph Concepts: State, Nodes and Edges',
              'Conditional Edges and Decision Routing',
              'Human-in-the-Loop Approval Steps',
              'Building Multi-Step Cyclic AI Workflows',
            ],
          },
          {
            category: 'AI Web Interfaces',
            items: [
              'Introduction to Streamlit for Rapid AI UIs',
              'Introduction to Gradio for ML Playground Demos',
              'Building Interactive Chat & Document Upload UIs',
              'Connecting Frontend Interfaces with AI Pipelines',
              'End-to-End Testing of AI Applications',
            ],
          },
          {
            category: 'Git Version Control & Deployment',
            items: [
              'Introduction to Git and GitHub',
              'Repository Creation, Branches, Commits and Pushing',
              'Basic Git Commands Workflow',
              'Writing Clean Project Documentation (README.md, Architecture diagrams)',
              'Managing requirements.txt / pyproject.toml',
              'Environment Variables & API Key Security in Production',
              'Basic Deployment to Streamlit Community Cloud / HuggingFace Spaces / Render',
            ],
          },
        ],
        miniProjects: ['AI Agent Application with Web Interface and Real-Time Tools'],
      },
      {
        no: 19,
        name: 'Vibe Coding: Build a Website with AI',
        type: 'No-code',
        duration: '0.25 Month | Weeks 45',
        hours: 10,
        subtopics: [
          {
            category: 'Introduction to Vibe Coding',
            items: [
              'What is Vibe Coding? Building Software at the Speed of Thought',
              'Traditional Coding vs AI-Assisted Building Comparison',
              'Strengths, Limitations and Developer Mindset',
            ],
          },
          {
            category: 'Planning a Web Application',
            items: [
              'Defining Idea, Target Audience & Core User Flows',
              'Outlining Pages, Sections and Functional Components',
              'Content Strategy, Copywriting and Asset Structure',
              'Choosing Cohesive Color Palettes, Typography and Style Systems',
            ],
          },
          {
            category: 'Building with AI Builders',
            items: [
              'Writing Effective Prompts for Websites and Apps',
              'Modern AI Website / App Builders (v0.dev, Lovable, Bolt.new, Cursor)',
              'Generating Responsive Layouts and Component Sections',
              'Adding Dynamic Forms, Buttons, Filters and State Interactions',
            ],
          },
          {
            category: 'Refining, Fixing & Responsive Polish',
            items: [
              'Iterating with Targeted Follow-up Prompts',
              'Fixing Errors and Layout Bugs by Describing Visual Problems',
              'Making the Site Mobile-Responsive and Tablet-Optimized',
            ],
          },
          {
            category: 'Publishing & Hosting',
            items: [
              'Understanding Generated HTML / CSS / JavaScript Basics',
              'Hosting and Publishing a Live Website (Vercel, Netlify)',
              'Reviewing AI Output, Performance and Security Awareness',
            ],
          },
        ],
        miniProjects: [
          'Personal AI Portfolio Website',
          'SaaS Startup Business Landing Page',
          'AI Project Showcase Platform',
        ],
      },
      {
        no: 20,
        name: 'Final Capstone Project',
        type: 'Project',
        duration: '0.75 Month | Weeks 46–48',
        hours: 20,
        subtopics: [
          {
            category: 'Capstone Project Overview',
            items: [
              'Students will design, develop and present a complete AI-based application using the technologies learned throughout the course.',
              'End-to-end integration of Code + No-code paradigms',
            ],
          },
          {
            category: 'Capstone Development Phases',
            items: [
              'Phase 1: Problem Selection, User Persona and Architecture Proposal',
              'Phase 2: Planning, Data Schema, UI Wireframes and Tech Stack Selection',
              'Phase 3: Development, RAG / Agent / CV Integration and API Connection',
              'Phase 4: Testing, Performance Optimization and Documentation',
              'Phase 5: Final Live Presentation, Video Walkthrough and Demonstration',
            ],
          },
          {
            category: 'Sample Capstone Ideas',
            items: [
              'AI PDF / Enterprise Document Assistant using Advanced RAG',
              'Autonomous AI Customer Support & Ticketing Agent',
              'Smart Safety & Traffic Camera App using YOLO & OpenCV',
              'Predictive Business Analytics App with Interactive Power BI Dashboard',
              'n8n Autonomous Multi-Channel AI Workflow with Webhook Interface',
            ],
          },
          {
            category: 'Evaluation & Graduation Criteria',
            items: [
              'Problem Relevance & Real-World Utility (25%)',
              'Technical Implementation & Code Cleanliness (25%)',
              'Working Demo & User Experience (25%)',
              'Documentation, GitHub Repository & Video Presentation (25%)',
            ],
          },
        ],
        miniProjects: [
          'AI PDF Question Answering System',
          'AI Agent Application',
          'Portfolio / Landing Page Website (Vibe Coding)',
          'Final Production-Grade Capstone Project',
        ],
      },
    ],
    units: [
      {
        unitNumber: 'Module 17',
        title: 'Embeddings, RAG & LangChain (Code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'Text Embeddings, FAISS & ChromaDB Vector Stores',
          'RAG Architecture: Chunking, Retrieval & Prompt Augmentation',
          'LangChain Retrievers & LCEL Production Chains',
          'AI PDF Assistant Project with Citation Support',
        ],
      },
      {
        unitNumber: 'Module 18',
        title: 'AI Agents, LangGraph & Deployment (Code - 15 Hours)',
        weightage: '15 Hours',
        topics: [
          'ReAct AI Agents with Custom Tool Calling',
          'LangGraph Multi-Agent Workflows & Human-in-the-Loop',
          'Streamlit & Gradio Interactive Frontends',
          'Git, GitHub, API Keys & Cloud Deployment',
        ],
      },
      {
        unitNumber: 'Module 19',
        title: 'Vibe Coding: Build Websites with AI (No-code - 10 Hours)',
        weightage: '10 Hours',
        topics: [
          'Vibe Coding Mindset & Prompt-Driven Software Creation',
          'v0, Lovable, Bolt.new & Cursor Web Engineering',
          'Responsive UI Polish & Interactive Components',
          'Production Hosting on Vercel & Netlify',
        ],
      },
      {
        unitNumber: 'Module 20',
        title: 'Final Capstone Project (Project - 20 Hours)',
        weightage: '20 Hours',
        topics: [
          'Proposal, Architecture Design & Tech Stack Selection',
          'Full-Stack AI Application Development & Integration',
          'Testing, GitHub Repository Docs & Live Demo Presentation',
          'Graduation & Ready for High-Paying AI/Data Careers!',
        ],
      },
    ],
  },
];
