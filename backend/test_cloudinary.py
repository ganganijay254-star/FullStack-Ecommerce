import cloudinary
import cloudinary.api

cloudinary.config(
    cloud_name="dq4dy1lnz",
    api_key="994695595874349",
    api_secret="lEE0d8_hSE88HSo42dqVfDc6A-I",   # <-- yahan apna actual API Secret paste karo
    secure=True,
)

try:
    print(cloudinary.api.ping())
except Exception as e:
    print("ERROR:", e)