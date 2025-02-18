FROM continuumio/miniconda3

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y wget uwsgi-plugin-python3

# Create non-root user
ARG UID=1000
ARG GID=1000

RUN groupadd -g "${GID}" appgroup && \
    useradd --create-home --no-log-init -u "${UID}" -g "${GID}" appuser

USER appuser

WORKDIR /home/appuser

# Install esa-snap
RUN wget https://download.esa.int/step/snap/11.0/installers/esa-snap_all_linux-11.0.0.sh && \
    chmod +x esa-snap_all_linux-11.0.0.sh && \
    ./esa-snap_all_linux-11.0.0.sh -q

# Install floodpy
RUN git clone https://github.com/adamsigi/FLOODPY.git
RUN conda env create -f FLOODPY/FLOODPY_gpu_env.yml

ENV FLOODPY_HOME=/home/appuser/FLOODPY
ENV PYTHONPATH="${PYTHONPATH}:${FLOODPY_HOME}"
ENV PATH="${PATH}:${FLOODPY_HOME}/floodpy"

COPY --chown=appuser pconvert.vmoptions /home/appuser/esa-snap/bin/pconvert.vmoptions

RUN cp /home/appuser/esa-snap/bin/pconvert.vmoptions /home/appuser/esa-snap/bin/gpt.vmoptions

RUN mkdir -p /home/appuser/.snap/etc

# https://senbox.atlassian.net/wiki/spaces/SNAP/pages/15269950/SNAP+Configuration
COPY --chown=appuser snap.properties /home/appuser/.snap/etc/snap.properties

WORKDIR /home/appuser/backend

COPY requirements.txt .
RUN conda run -n floodpy_gpu pip install -r requirements.txt
RUN conda install -n floodpy_gpu -c conda-forge uwsgi=2.0.21=py38h0268a7a_0

COPY --chown=appuser . .
RUN mkdir -p /home/appuser/floodpy_projects/products

RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
