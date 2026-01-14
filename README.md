<img width="2839" height="1702" alt="image" src="https://github.com/user-attachments/assets/dc6e86d2-ac23-4436-b3fd-690944aecdfb" />



trackr is a bare bones time tracking app made to be simple and without the bloat that many others have with it. Its main focus is making personal time tracking simple while still being able to show stats/analytics that most other lock behind a pay wall, but for free. It was made using Supabase as a database along Next js for user auth, made with next js for the front end and back end, used tailwind css and a bit of manual css for the styling, and was deployed on vercel.

### Features
trackr allows you to track different time sessions, with it allowing for you to be able to assign groups to these sessions / put tags onto them. Then you can see total hours, popular groups, amount of hours over time, and different group ratios. It also allows users to edit pre-existing time sessions, delete them, and export all time sessions as an excel sheet ( More export options coming soon)


### Installation
### Step 1
You could do it through 2 different ways, downloading the zip file or cloning. For downloading it, you can download the zip file on the github page and then unzip it and open the folder. For cloning the repository, you can just run 
```
git clone https://github.com/retekant/trackr.git
cd trackr
```

### Step 2
To install any packages that you will need, you can run
```
npm install
npm install file-saver exceljs @types/file-saver recharts
```

Then, to set up environment variables, create a file called .env.local and make these 2 variables
```
NEXT_PUBLIC_SUPABASE_URL= 
NEXT_PUBLIC_SUPABASE_ANON_KEY= 
```
and then fill in the variables with your keys

### Step 4
To set up the tables, run this code in the SQL Editor in supabase
```
CREATE TABLE public.time_sessions (
  group text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT gen_random_uuid(),
  start_time timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  duration bigint,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT time_sessions_pkey PRIMARY KEY (id)
);


```
Then create these policies to allow the users to use / edit the tables

<img width="1829" height="657" alt="image" src="https://github.com/user-attachments/assets/036bde7d-d507-45a1-b0bd-fcec35000f6b" />

<img width="1183" height="1237" alt="image" src="https://github.com/user-attachments/assets/e8a871bf-f025-4981-999e-3a3c1a4375b0" />


### Step 5
Start the app by running 
```
npm run dev
```


### Link: https://trackr-nu.vercel.app

Photos:
<img width="2836" height="1442" alt="image" src="https://github.com/user-attachments/assets/2e278f56-d057-466b-bb65-bfa91d0815ce" />
<img width="2872" height="1796" alt="image" src="https://github.com/user-attachments/assets/e202433f-084e-40ff-9794-a2806fef04b2" />


