'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FieldValues, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import uniqid from 'uniqid';
import useUploadModal from '@/hooks/useUploadModal';
import { useUser } from '@/hooks/useUser';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

const schema = yup.object({
  author: yup.string().required('Author name is required'),
  title: yup.string().required('Song title is required'),
  song: yup.mixed().test('required', 'Song file is required', (song) => {
    if (song) {
      return true;
    }
    return false;
  }),
  image: yup.mixed().test('required', 'Image file is required', (image) => {
    if (image) return true;
    return false;
  }),
});

const UploadModal = () => {
  const uploadModal = useUploadModal();
  const { user } = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      author: '',
      title: '',
      song: '',
      image: '',
    },
    resolver: yupResolver<FieldValues>(schema),
  });

  const onChange = (open: boolean) => {
    if (!open) {
      reset();
      uploadModal.onClose();
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async (values) => {
    try {
      setIsLoading(true);

      const imageFile = values?.image?.[0];
      const songFile = values?.song?.[0];

      if (!user || !imageFile || !songFile) {
        toast.error('Invalid files');
        return;
      }

      const uniqueID = uniqid();

      const { data: songData, error: songError } = await supabaseClient.storage
        .from('songs')
        .upload(`song-${values.title}-${uniqueID}`, songFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (songError) {
        setIsLoading(false);
        return toast.error('Failed song upload');
      }

      const { data: imageData, error: imageError } =
        await supabaseClient.storage
          .from('images')
          .upload(`image-${values.title}-${uniqueID}`, imageFile, {
            cacheControl: '3600',
            upsert: false,
          });

      if (imageError) {
        setIsLoading(false);
        return toast.error('Failed image upload');
      }

      const { error: supabaseError } = await supabaseClient
        .from('songs')
        .insert({
          user_id: user.id,
          title: values.title,
          author: values.author,
          image_path: imageData.path,
          song_path: songData.path,
        });

      if (supabaseError) {
        setIsLoading(false);
        return toast.error(supabaseError.message);
      }

      router.refresh();
      setIsLoading(false);
      toast.success('Song created!');
      reset();
      uploadModal.onClose();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Add a song"
      description="Upload a mp3 file"
      isOpen={uploadModal.isOpen}
      onChange={onChange}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
        <Input
          id="title"
          disabled={isLoading}
          {...register('title')}
          placeholder="Song title"
        />
        <div className="text-red-600">{errors?.title?.message?.toString()}</div>
        <Input
          id="author"
          disabled={isLoading}
          {...register('author')}
          placeholder="Song author"
        />
        <div className="text-red-600">
          {errors?.author?.message?.toString()}
        </div>
        <div>
          <div className="pb-1">Select a song file</div>

          <Input
            id="song"
            disabled={isLoading}
            type="file"
            accept=".mp3"
            {...register('song')}
          />
          <div className="text-red-600">
            {errors?.song?.message?.toString()}
          </div>
        </div>
        <div>
          <div className="pb-1">Select an image</div>

          <Input
            id="image"
            disabled={isLoading}
            type="file"
            accept="image/*"
            {...register('image')}
          />
          <div className="text-red-600">
            {errors?.image?.message?.toString()}
          </div>
        </div>

        <Button disabled={isLoading} type="submit">
          Create
        </Button>
      </form>
    </Modal>
  );
};

export default UploadModal;
