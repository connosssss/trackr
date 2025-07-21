![image](https://github.com/user-attachments/assets/8fd3d11e-1d17-4583-aa7f-a66310df86c9)


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

CREATE TABLE public.group_stats (
  session_count integer NOT NULL DEFAULT 0,
  total_duration integer NOT NULL DEFAULT 0,
  user_id uuid NOT NULL,
  group_name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT group_stats_pkey PRIMARY KEY (id)
);
```
Then create these policies to allow the users to use / edit the tables
<img width="1602" height="765" alt="image" src="https://github.com/user-attachments/assets/a706feb0-b390-4ccd-996b-c6abc802cf55" />
<img width="992" height="907" alt="image" src="https://github.com/user-attachments/assets/7b27ca08-5e60-4e07-b7b9-2e6d409e90c8" />

### Step 5
Start the app by running 
```
npm run dev
```


### Link: https://trackr-nu.vercel.app

Photos:
![image](https://github.com/user-attachments/assets/cb758ca1-e38f-40f3-9213-1469c8dd7d07)
![image](https://github.com/user-attachments/assets/1dae199b-64f8-482a-ae21-367ac4c609be)
![image](https://github.com/user-attachments/assets/bb399e9d-37a6-48b6-b7f1-0dd92d31ebe9)
(photos not able to show everything there is)
