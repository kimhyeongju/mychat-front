import os

def rename_files():
    current_dir = os.getcwd()
    files = os.listdir(current_dir)
    target_files = [f for f in files if f.startswith("server-") and f.endswith(".jpg")]
    
    # 파일 이름에 포함된 숫자 기준으로 정렬하기 위한 함수
    def get_file_number(filename):
        num_str = filename.replace("server-", "").replace(".jpg", "")
        return int(num_str)
    
    target_files.sort(key=get_file_number)
    
    # 파일 이름 및 확장자 변경 작업 수행
    for index, filename in enumerate(target_files, start=1):
        new_name = f"{index:02d}.webp"
        
        old_path = os.path.join(current_dir, filename)
        new_path = os.path.join(current_dir, new_name)
        
        # 파일 이름 변경
        os.rename(old_path, new_path)
        print(f"변경 완료: {filename} -> {new_name}")

if __name__ == "__main__":
    rename_files()