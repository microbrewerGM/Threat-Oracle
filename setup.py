from setuptools import setup, find_packages

setup(
    name='threat_oracle',
    version='0.1.0',
    packages=find_packages(),
    entry_points={
        'console_scripts': [
            'threat_oracle=threat_oracle.main:main',
        ],
    },
    install_requires=[
        'py2neo>=2021.1.5'
    ],
    description='Threat Oracle is a threat modeling tool with a digital twin, graph structure, and vialuzation.',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    url='https://github.com/microbrewerGM/Threat-Oracle',
    author='Threat Oracle Author',
    author_email='info@threat-oracle.local',
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.10',
)
